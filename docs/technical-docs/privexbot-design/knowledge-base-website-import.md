## 🌐 Import Data from a Website into Your Privexbot Knowledge Base

Privexbot allows you to **pull content directly from public websites** and turn it into clean text that your **secret ai** can understand and use. This is done using open-source tools like **Firecrawl** and **Jina Reader**, which convert web pages into structured Markdown format and then import that data into your knowledge base.

---

## 🔧 Tools You Can Use

* **Firecrawl**
* **Jina Reader**

Both tools:

* Are open-source
* Convert websites into clean, readable text
* Offer easy API access for integration

---

## 🚀 Using Firecrawl with Privexbot

### Step 1: Set Up Firecrawl API

1. Click your **profile avatar** (top right) in Privexbot.
2. Go to **DataSource** > Click **Configure** next to **Firecrawl**.
3. Sign up at the [Firecrawl website](https://firecrawl.dev), get your **API Key**.
4. Paste and **save the API Key** in Privexbot.

### Step 2: Crawl a Website

1. Go to the **Create Knowledge Base** page.
2. Choose **Sync from Website**.
3. Select **Firecrawl** as the tool.
4. Enter the **URL** of the website you want to import from.

**Optional settings include:**

* Whether to include **sub-pages**
* **Max number of pages** to crawl
* **Crawling depth** (how many links deep to go)
* **Exclude/include specific paths**
* Define which content to extract

Click **Run** to start crawling and see a preview of the content being imported.

### Step 3: Review and Add More

* Once the crawl finishes, the content will appear as documents in your **knowledge base**.
* You can check the imported data and click **Add URL** to bring in more web pages anytime.

---

## 🔍 Using Jina Reader with Privexbot

### Step 1: Set Up Jina Reader API

1. Click your **profile avatar** in Privexbot.
2. Go to **DataSource** > Click **Configure** next to **Jina Reader**.
3. Register at the [Jina Reader website](https://jina.ai), get your **API Key**.
4. Paste and **save the key** in Privexbot.

### Step 2: Crawl Web Content

1. On the **Create Knowledge Base** page, choose **Sync from Website**.
2. Select **Jina Reader** as the source.
3. Enter the **URL** you want to scrape.

**Configuration options:**

* Crawl **sub-pages** or not
* Set **max number of pages**
* Enable **sitemap crawling** if available

Click **Run** to begin the process and preview what pages will be imported.

### Step 3: Import and Manage Content

* The parsed content will be added to your knowledge base automatically.
* You can find it in the **Documents** section.
* Click **Add URL** to keep importing more web pages as needed.

---

## ✅ What Happens Next?

* The imported content becomes part of your knowledge base.
* **Secret ai** can now use this information to answer questions or perform actions — just like it does with documents you upload.
* You can always return to add, manage, or update the imported content.
