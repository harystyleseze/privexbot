What's Covered:

1. Chatbot vs Chatflow: Critical Differences (Section 2)

- ✅ Clear distinction between simple chatbot (form-based) and chatflow (workflow-based)
- ✅ Side-by-side comparison table
- ✅ Execution flow differences (linear vs graph)
- ✅ Configuration structure examples
- ✅ When to use which type
- ✅ Separate database models emphasized

2. Chatflow Node System (Section 6)

- ✅ 10+ node types documented (LLM, KB, Condition, API, Database, Loop, Memory, etc.)
- ✅ Each node type with JSON configuration examples
- ✅ Credential management system (encrypted storage for API keys)
- ✅ Variable system (template syntax, resolution logic)
- ✅ Complete execution engine pseudocode

3. Secret AI Integration (Section 5)

- ✅ Backend-only implementation (never in widget)
- ✅ Used by both chatbot (single call) and chatflow (multiple LLM nodes)
- ✅ Complete InferenceService pseudocode
- ✅ RAG (Knowledge Base) integration flow

4. Deployment Architecture

- ✅ Website embed widget (separate JS package)
- ✅ Discord/Telegram/WhatsApp integration
- ✅ Zapier integration
- ✅ All channels work for BOTH chatbot and chatflow

5. Complete Folder Structure (Section 10)

- ✅ Backend: Separate services for chatbot vs chatflow
- ✅ Backend: chatflow/nodes/ folder with node executors
- ✅ Frontend: Separate chatbot/ and chatflow/ component folders
- ✅ Frontend: ChatflowBuilder.jsx with ReactFlow
- ✅ Widget: Unified package (works with both types)

6. Unified Public API (Section 11)

- ✅ /v1/bots/{id}/chat - auto-detects chatbot vs chatflow
- ✅ Legacy endpoints for backward compatibility
- ✅ detect_bot_type() function
- ✅ Routes to correct service based on bot type

7. Chat Sessions & History (Section 9)

- ✅ Works for BOTH chatbot and chatflow
- ✅ bot_type field distinguishes which type
- ✅ Chatflow sessions include execution logs
- ✅ Session management pseudocode

8. Implementation Examples

- ✅ Complete chatbot_service.py pseudocode
- ✅ Complete chatflow_executor.py pseudocode (graph traversal)
- ✅ Node execution examples (LLM, KB, HTTP, etc.)
- ✅ Widget embed code generation
- ✅ Dashboard UI examples (form vs drag-and-drop)

Key Highlights:

🎯 Separation is Clear: Chatbot and chatflow are treated as completely separate entities throughout:

- Separate tables (chatbots vs chatflows)
- Separate services (chatbot_service.py vs chatflow_service.py)
- Separate builders (ChatbotBuilder.jsx vs ChatflowBuilder.jsx)

🎯 Deployment is Unified: Both types deploy the same way:

- Same widget code
- Same multi-channel webhooks
- Unified API endpoint (/v1/bots/{id}/chat)

🎯 Node System Fully Documented:

- 10+ node types with configuration examples
- Credential management (like n8n)
- Variable templating system ({{variable}})
- Graph execution engine with conditionals/loops

🎯 No Over-Engineering:

- Clear, practical pseudocode
- Consistent with your existing codebase
- Follows multi-tenant architecture
- Simple widget implementation

The document is now a complete reference for anyone building this system from scratch, with emphasis on the chatbot/chatflow distinction while keeping deployment unified.
