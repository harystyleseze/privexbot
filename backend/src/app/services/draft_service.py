"""
Draft Service - Unified draft management for chatbots, chatflows, and knowledge bases.

WHY:
- ALL entity creation happens in draft mode BEFORE database save
- Users can preview, test, configure without polluting database
- Easy to abandon (just delete from Redis)
- Fast auto-save (Redis is in-memory)
- Consistent pattern across all entity types

HOW:
- Store drafts in Redis with TTL (24 hours)
- Auto-extend TTL on each save
- Validate before deployment
- Deploy to database + initialize channels
- Delete draft after successful deployment

KEY DESIGN PRINCIPLES:
- Single service handles all entity types (DRY)
- Type-specific logic in separate methods
- Deployment triggers webhook registration
- Error handling per channel

PSEUDOCODE follows the existing codebase patterns.
"""

from enum import Enum
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import redis
import json

from sqlalchemy.orm import Session

from app.core.config import settings


class DraftType(str, Enum):
    """Supported draft types."""
    CHATBOT = "chatbot"
    CHATFLOW = "chatflow"
    KB = "kb"


class UnifiedDraftService:
    """
    Unified draft management for all entity types.

    WHY: Consistent draft pattern across chatbots, chatflows, KBs
    HOW: Single service, type-specific handlers
    """

    def __init__(self):
        """
        Initialize Redis connection for draft storage.

        WHY: Separate Redis DB for drafts
        HOW: Redis db=1 for drafts, db=0 for cache
        """
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=1,  # Separate DB for drafts
            decode_responses=True
        )

        self.default_ttl = 24 * 60 * 60  # 24 hours in seconds


    def create_draft(
        self,
        draft_type: DraftType,
        workspace_id: UUID,
        created_by: UUID,
        initial_data: dict
    ) -> str:
        """
        Create new draft (any type).

        FLOW:
        1. Generate draft_id
        2. Create draft structure
        3. Store in Redis with TTL
        4. Return draft_id

        ARGS:
            draft_type: Type of entity (chatbot, chatflow, kb)
            workspace_id: Workspace this draft belongs to
            created_by: User creating the draft
            initial_data: Initial configuration data

        RETURNS:
            draft_id: Unique draft identifier
        """

        # Generate unique ID
        draft_id = f"draft_{draft_type.value}_{uuid4().hex[:8]}"

        # Create draft structure
        draft = {
            "id": draft_id,
            "type": draft_type.value,
            "workspace_id": str(workspace_id),
            "created_by": str(created_by),
            "status": "draft",
            "auto_save_enabled": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "last_auto_save": None,
            "expires_at": (datetime.utcnow() + timedelta(seconds=self.default_ttl)).isoformat(),
            "data": initial_data,
            "preview": {}
        }

        # Store in Redis with TTL
        redis_key = f"draft:{draft_type.value}:{draft_id}"
        self.redis_client.setex(
            redis_key,
            self.default_ttl,
            json.dumps(draft)
        )

        return draft_id


    def get_draft(
        self,
        draft_type: DraftType,
        draft_id: str
    ) -> Optional[dict]:
        """
        Get draft by type and ID.

        RETURNS:
            Draft data or None if not found/expired
        """

        redis_key = f"draft:{draft_type.value}:{draft_id}"
        data = self.redis_client.get(redis_key)

        if not data:
            return None

        return json.loads(data)


    def update_draft(
        self,
        draft_type: DraftType,
        draft_id: str,
        updates: dict,
        extend_ttl: bool = True
    ):
        """
        Update draft (auto-save).

        WHY: Auto-save on every change (debounced from frontend)
        HOW: Merge updates, extend TTL, save to Redis

        ARGS:
            draft_type: Type of entity
            draft_id: Draft identifier
            updates: Partial updates to apply
            extend_ttl: Whether to reset TTL to 24 hours
        """

        # Get existing draft
        draft = self.get_draft(draft_type, draft_id)
        if not draft:
            raise ValueError(f"Draft not found or expired: {draft_id}")

        # Merge updates
        if "data" in updates:
            # Deep merge data field
            draft["data"].update(updates["data"])

        if "preview" in updates:
            draft["preview"] = updates["preview"]

        # Update timestamps
        draft["updated_at"] = datetime.utcnow().isoformat()
        draft["last_auto_save"] = datetime.utcnow().isoformat()

        # Save back to Redis
        redis_key = f"draft:{draft_type.value}:{draft_id}"

        # Determine TTL
        if extend_ttl:
            ttl = self.default_ttl  # Reset to 24 hours
        else:
            ttl = self.redis_client.ttl(redis_key)  # Keep existing TTL

        self.redis_client.setex(
            redis_key,
            ttl,
            json.dumps(draft)
        )


    def delete_draft(
        self,
        draft_type: DraftType,
        draft_id: str
    ):
        """
        Delete draft from Redis.

        WHY: User abandons or deploys draft
        """

        redis_key = f"draft:{draft_type.value}:{draft_id}"
        self.redis_client.delete(redis_key)


    def list_drafts(
        self,
        draft_type: DraftType,
        workspace_id: UUID,
        limit: int = 50
    ) -> list[dict]:
        """
        List all drafts for a workspace.

        WHY: Show drafts in dashboard
        HOW: Scan Redis keys, filter by workspace

        NOTE: This is expensive for large Redis DBs
        BETTER: Store draft IDs in a workspace-specific list
        """

        # Pattern to match all drafts of this type
        pattern = f"draft:{draft_type.value}:*"

        # Scan Redis (cursor-based iteration)
        drafts = []
        cursor = 0

        while True:
            cursor, keys = self.redis_client.scan(
                cursor,
                match=pattern,
                count=100
            )

            # Get draft data for each key
            for key in keys:
                data = self.redis_client.get(key)
                if data:
                    draft = json.loads(data)

                    # Filter by workspace
                    if draft["workspace_id"] == str(workspace_id):
                        drafts.append(draft)

                    # Limit results
                    if len(drafts) >= limit:
                        return drafts

            # Stop when cursor returns to 0
            if cursor == 0:
                break

        return drafts


    def validate_draft(
        self,
        draft_type: DraftType,
        draft_id: str
    ) -> dict:
        """
        Validate draft before deployment.

        WHY: Ensure all required fields present
        HOW: Type-specific validation

        RETURNS:
            {
                "valid": bool,
                "errors": list[str],
                "warnings": list[str]
            }
        """

        draft = self.get_draft(draft_type, draft_id)
        if not draft:
            raise ValueError(f"Draft not found: {draft_id}")

        errors = []
        warnings = []

        # Type-specific validation
        if draft_type == DraftType.CHATBOT:
            errors, warnings = self._validate_chatbot(draft)
        elif draft_type == DraftType.CHATFLOW:
            errors, warnings = self._validate_chatflow(draft)
        elif draft_type == DraftType.KB:
            errors, warnings = self._validate_kb(draft)

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }


    def _validate_chatbot(self, draft: dict) -> tuple[list, list]:
        """Validate chatbot draft."""

        errors = []
        warnings = []
        data = draft["data"]

        # Required fields
        if not data.get("name"):
            errors.append("Name is required")

        if not data.get("system_prompt"):
            errors.append("System prompt is required")

        # At least one deployment channel
        deployment = data.get("deployment", {})
        channels = deployment.get("channels", [])
        enabled_channels = [c for c in channels if c.get("enabled")]

        if not enabled_channels:
            errors.append("At least one deployment channel must be enabled")

        # Warnings
        if not data.get("knowledge_bases"):
            warnings.append("No knowledge bases configured - bot will not have context")

        if not data.get("appearance", {}).get("welcome_message"):
            warnings.append("Welcome message not set - using default")

        return errors, warnings


    def _validate_chatflow(self, draft: dict) -> tuple[list, list]:
        """Validate chatflow draft."""

        errors = []
        warnings = []
        data = draft["data"]

        # Required fields
        if not data.get("name"):
            errors.append("Name is required")

        if not data.get("nodes"):
            errors.append("Workflow has no nodes")

        # Check for start node
        nodes = data.get("nodes", [])
        has_start = any(node["type"] == "trigger" for node in nodes)
        if not has_start:
            errors.append("Workflow must have a start/trigger node")

        # Check for response node
        has_response = any(node["type"] == "response" for node in nodes)
        if not has_response:
            errors.append("Workflow must have a response node")

        # Check for disconnected nodes
        edges = data.get("edges", [])
        node_ids = {node["id"] for node in nodes}
        connected_nodes = set()
        for edge in edges:
            connected_nodes.add(edge["source"])
            connected_nodes.add(edge["target"])

        disconnected = node_ids - connected_nodes
        if disconnected and len(disconnected) > 1:  # Start node might not have incoming edges
            warnings.append(f"Disconnected nodes: {', '.join(disconnected)}")

        # At least one deployment channel
        deployment = data.get("deployment", {})
        channels = deployment.get("channels", [])
        enabled_channels = [c for c in channels if c.get("enabled")]

        if not enabled_channels:
            errors.append("At least one deployment channel must be enabled")

        return errors, warnings


    def _validate_kb(self, draft: dict) -> tuple[list, list]:
        """Validate KB draft."""

        errors = []
        warnings = []
        data = draft["data"]

        if not data.get("name"):
            errors.append("Name is required")

        if not data.get("sources"):
            errors.append("No sources added - KB will be empty")

        if not data.get("embedding_config"):
            errors.append("Embedding configuration required")

        return errors, warnings


    def deploy_draft(
        self,
        draft_type: DraftType,
        draft_id: str,
        db: Session
    ) -> dict:
        """
        Deploy draft → Save to database + initialize channels.

        FLOW:
        1. Validate draft
        2. Create database record
        3. Type-specific initialization (webhooks, API keys, etc.)
        4. Delete draft from Redis
        5. Return deployment results

        RETURNS:
            {
                "entity_id": "uuid",
                "status": "deployed",
                "channels": {
                    "website": {"status": "success", ...},
                    "telegram": {"status": "success", ...}
                }
            }
        """

        # Validate
        validation = self.validate_draft(draft_type, draft_id)
        if not validation["valid"]:
            raise ValueError(f"Validation failed: {validation['errors']}")

        draft = self.get_draft(draft_type, draft_id)

        # Deploy based on type
        if draft_type == DraftType.CHATBOT:
            result = self._deploy_chatbot(draft, db)
        elif draft_type == DraftType.CHATFLOW:
            result = self._deploy_chatflow(draft, db)
        elif draft_type == DraftType.KB:
            result = self._deploy_kb(draft, db)

        # Delete draft from Redis on success
        self.delete_draft(draft_type, draft_id)

        return result


    def _deploy_chatbot(self, draft: dict, db: Session) -> dict:
        """
        Deploy chatbot to database + initialize multi-channel deployments.

        RETURNS:
            {
                "chatbot_id": "uuid",
                "status": "deployed",
                "channels": {...}
            }
        """

        from app.models.chatbot import Chatbot
        from app.models.api_key import APIKey

        data = draft["data"]

        # Create chatbot record
        chatbot = Chatbot(
            workspace_id=UUID(draft["workspace_id"]),
            name=data["name"],
            config=data,  # Store entire config as JSONB (includes deployment config)
            created_by=UUID(draft["created_by"])
        )

        db.add(chatbot)
        db.flush()  # Get chatbot.id without committing

        # Generate primary API key
        api_key = APIKey(
            workspace_id=chatbot.workspace_id,
            entity_type="chatbot",
            entity_id=chatbot.id,
            created_by=chatbot.created_by
        )

        db.add(api_key)
        db.commit()  # Commit chatbot + API key

        # Initialize multi-channel deployments
        deployment_results = self._initialize_channels(
            entity_id=chatbot.id,
            entity_type="chatbot",
            deployment_config=data.get("deployment", {}),
            api_key=api_key.key,
            db=db
        )

        return deployment_results


    def _deploy_chatflow(self, draft: dict, db: Session) -> dict:
        """
        Deploy chatflow to database + initialize multi-channel deployments.

        Chatflows support the SAME channels as chatbots.
        """

        from app.models.chatflow import Chatflow
        from app.models.api_key import APIKey

        data = draft["data"]

        # Create chatflow record
        chatflow = Chatflow(
            workspace_id=UUID(draft["workspace_id"]),
            name=data["name"],
            config=data,  # Store entire config as JSONB (includes deployment config)
            version=1,
            is_active=True,
            created_by=UUID(draft["created_by"])
        )

        db.add(chatflow)
        db.flush()

        # Generate API key
        api_key = APIKey(
            workspace_id=chatflow.workspace_id,
            entity_type="chatflow",
            entity_id=chatflow.id,
            created_by=chatflow.created_by
        )

        db.add(api_key)
        db.commit()

        # Initialize multi-channel deployments (reuses chatbot logic)
        deployment_results = self._initialize_channels(
            entity_id=chatflow.id,
            entity_type="chatflow",
            deployment_config=data.get("deployment", {}),
            api_key=api_key.key,
            db=db
        )

        return deployment_results


    def _deploy_kb(self, draft: dict, db: Session) -> dict:
        """
        Deploy KB to database.

        Delegates to kb_service for KB-specific logic.
        """

        from app.models.knowledge_base import KnowledgeBase

        data = draft["data"]

        # Create KB record
        kb = KnowledgeBase(
            workspace_id=UUID(draft["workspace_id"]),
            name=data["name"],
            description=data.get("description"),
            config=data,
            created_by=UUID(draft["created_by"])
        )

        db.add(kb)
        db.commit()
        db.refresh(kb)

        return {
            "kb_id": str(kb.id),
            "status": "deployed",
            "processing": "background"  # Documents processed by Celery
        }


    def _initialize_channels(
        self,
        entity_id: UUID,
        entity_type: str,
        deployment_config: dict,
        api_key: str,
        db: Session
    ) -> dict:
        """
        Initialize multi-channel deployments (shared by chatbot & chatflow).

        WHY: Both chatbots and chatflows deploy to same channels
        HOW: Iterate enabled channels, register webhooks, generate codes

        RETURNS:
            {
                "chatbot_id": "uuid" or "chatflow_id": "uuid",
                "status": "deployed",
                "channels": {
                    "website": {"status": "success", "embed_code": "..."},
                    "telegram": {"status": "success", "webhook_url": "...", "bot_username": "@bot"},
                    "discord": {"status": "error", "error": "Invalid token"}
                }
            }
        """

        deployment_results = {
            f"{entity_type}_id": str(entity_id),
            "status": "deployed",
            "channels": {}
        }

        channels = deployment_config.get("channels", [])

        for channel in channels:
            if not channel.get("enabled"):
                continue

            channel_type = channel["type"]

            try:
                if channel_type == "website":
                    # Generate embed code
                    deployment_results["channels"]["website"] = {
                        "status": "success",
                        "embed_code": self._generate_embed_code(entity_id, api_key),
                        "allowed_domains": channel["config"].get("allowed_domains", [])
                    }

                elif channel_type == "telegram":
                    # Register Telegram webhook (placeholder - requires integration)
                    deployment_results["channels"]["telegram"] = {
                        "status": "success",
                        "webhook_url": f"{settings.API_BASE_URL}/webhooks/telegram/{entity_id}",
                        "bot_token": channel["config"].get("bot_token")
                    }

                elif channel_type == "discord":
                    # Register Discord webhook (placeholder - requires integration)
                    deployment_results["channels"]["discord"] = {
                        "status": "success",
                        "webhook_url": f"{settings.API_BASE_URL}/webhooks/discord/{entity_id}"
                    }

                elif channel_type == "whatsapp":
                    # Configure WhatsApp Business API (placeholder - requires integration)
                    deployment_results["channels"]["whatsapp"] = {
                        "status": "success",
                        "webhook_url": f"{settings.API_BASE_URL}/webhooks/whatsapp/{entity_id}",
                        "phone_number": channel["config"].get("phone_number")
                    }

                elif channel_type == "zapier":
                    # Generate Zapier webhook URL
                    zapier_webhook = f"{settings.API_BASE_URL}/webhooks/zapier/{entity_id}"
                    deployment_results["channels"]["zapier"] = {
                        "status": "success",
                        "webhook_url": zapier_webhook
                    }

            except Exception as e:
                # Graceful degradation - log error but continue
                deployment_results["channels"][channel_type] = {
                    "status": "error",
                    "error": str(e)
                }

        return deployment_results


    def _generate_embed_code(self, entity_id: UUID, api_key: str) -> str:
        """Generate embed code for website widget."""

        widget_cdn_url = getattr(settings, "WIDGET_CDN_URL", "https://cdn.privexbot.com")

        return f"""<script>
  window.privexbotConfig = {{
    botId: '{entity_id}',
    apiKey: '{api_key}'
  }};
</script>
<script src="{widget_cdn_url}/widget.js"></script>"""


# Global instance
draft_service = UnifiedDraftService()
