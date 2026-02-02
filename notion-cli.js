#!/usr/bin/env node

/**
 * Notion CLI for OpenClaw
 * Standalone script - no build needed
 * Usage: node notion-cli.js <command> [args]
 */

const { Client } = require("@notionhq/client");

// Get token from environment
const getToken = () => {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error("❌ Error: NOTION_TOKEN not set");
    console.error("Add to ~/.openclaw/.env: NOTION_TOKEN=secret_xxxxxxxxxx");
    process.exit(1);
  }
  return token;
};

// Clean ID (remove hyphens)
const cleanId = (id) => id.replace(/-/g, "");

// Initialize client
const getClient = () => new Client({ auth: getToken() });

// Format output
const out = (data) => console.log(JSON.stringify(data, null, 2));

// Commands
const commands = {
  async test() {
    const notion = getClient();
    const results = await notion.search({ page_size: 20 });
    
    console.log("✅ Connected to Notion!");
    console.log(`Found ${results.results.length} accessible pages/databases:\n`);
    
    results.results.forEach((item, i) => {
      const title = item.title?.[0]?.text?.content || "Untitled";
      const type = item.object === "database" ? "📊" : "📄";
      const id = item.id.replace(/-/g, "").slice(0, 8) + "...";
      console.log(`${i + 1}. ${type} ${title} (${id})`);
    });
  },

  async "query-database"(dbId, ...args) {
    const notion = getClient();
    const cleanDbId = cleanId(dbId);
    
    // Parse args
    let filter = undefined;
    const filterIdx = args.indexOf("--filter");
    if (filterIdx !== -1 && args[filterIdx + 1]) {
      filter = JSON.parse(args[filterIdx + 1]);
    }
    
    const response = await notion.databases.query({
      database_id: cleanDbId,
      filter,
      page_size: 100,
    });
    
    const simplified = response.results.map((page) => ({
      id: page.id,
      url: page.url,
      created: page.created_time,
      properties: Object.fromEntries(
        Object.entries(page.properties).map(([k, v]) => {
          // Simplify property values
          let val = v;
          if (v.title) val = v.title.map((t) => t.text.content).join("");
          else if (v.rich_text) val = v.rich_text.map((t) => t.text.content).join("");
          else if (v.select) val = v.select.name;
          else if (v.multi_select) val = v.multi_select.map((s) => s.name);
          else if (v.status) val = v.status.name;
          else if (v.date) val = v.date;
          else if (v.number !== undefined) val = v.number;
          else if (v.checkbox !== undefined) val = v.checkbox;
          else if (v.email) val = v.email;
          else if (v.url) val = v.url;
          return [k, val];
        })
      ),
    }));
    
    out(simplified);
  },

  async "add-entry"(dbId, ...args) {
    const notion = getClient();
    const cleanDbId = cleanId(dbId);
    
    let properties = {};
    
    const titleIdx = args.indexOf("--title");
    if (titleIdx !== -1 && args[titleIdx + 1]) {
      const titleKey = "Name"; // Default, could be Title
      properties[titleKey] = { title: [{ text: { content: args[titleIdx + 1] } }] };
    }
    
    const propsIdx = args.indexOf("--properties");
    if (propsIdx !== -1 && args[propsIdx + 1]) {
      const extraProps = JSON.parse(args[propsIdx + 1]);
      properties = { ...properties, ...extraProps };
    }
    
    const result = await notion.pages.create({
      parent: { database_id: cleanDbId },
      properties,
    });
    
    out({ id: result.id, url: result.url, created: result.created_time });
  },

  async "get-page"(pageId) {
    const notion = getClient();
    const cleanPageId = cleanId(pageId);
    
    const [page, blocks] = await Promise.all([
      notion.pages.retrieve({ page_id: cleanPageId }),
      notion.blocks.children.list({ block_id: cleanPageId, page_size: 100 }),
    ]);
    
    out({ page, blocks: blocks.results });
  },

  async "update-page"(pageId, ...args) {
    const notion = getClient();
    const cleanPageId = cleanId(pageId);
    
    const propsIdx = args.indexOf("--properties");
    if (propsIdx === -1 || !args[propsIdx + 1]) {
      console.error("❌ Error: --properties required");
      process.exit(1);
    }
    
    const properties = JSON.parse(args[propsIdx + 1]);
    const result = await notion.pages.update({ page_id: cleanPageId, properties });
    
    out({ id: result.id, url: result.url, last_edited: result.last_edited_time });
  },

  async search(query) {
    const notion = getClient();
    const results = await notion.search({ query, page_size: 20 });
    
    const simplified = results.results.map((item) => ({
      id: item.id,
      title: item.title?.[0]?.text?.content || "Untitled",
      url: item.url,
      type: item.object,
    }));
    
    out(simplified);
  },

  async "get-database"(dbId) {
    const notion = getClient();
    const cleanDbId = cleanId(dbId);
    
    const result = await notion.databases.retrieve({ database_id: cleanDbId });
    
    out({
      id: result.id,
      title: result.title?.[0]?.text?.content || "Untitled",
      url: result.url,
      properties: result.properties,
    });
  },
};

// Help
const showHelp = () => {
  console.log(`
Notion CLI for OpenClaw

Usage: node notion-cli.js <command> [args]

Commands:
  test                      Test connection and list accessible pages
  query-database <id>       Query database entries
    [--filter '<json>']     Filter results
  add-entry <id>            Add entry to database
    --title "Name"
    [--properties '<json>'] Additional properties
  get-page <id>             Get page content and properties
  update-page <id>          Update page properties
    --properties '<json>'   Properties to update
  get-database <id>         Get database schema
  search <query>            Search workspace

Environment:
  NOTION_TOKEN    Required. Set in ~/.openclaw/.env

Examples:
  node notion-cli.js test
  node notion-cli.js query-database abc123... --filter '{"property":"Status","select":{"equals":"Done"}}'
  node notion-cli.js add-entry abc123... --title "New Idea" --properties '{"Status":{"select":{"name":"Idea"}}}'
  node notion-cli.js search "content ideas"

Database ID Format:
  From URL: https://www.notion.so/workspace/ABC123...
  Use: ABC123... (32 characters, no hyphens)
`);
};

// Main
const main = async () => {
  const [cmd, ...args] = process.argv.slice(2);
  
  if (!cmd || cmd === "--help" || cmd === "-h") {
    showHelp();
    return;
  }
  
  const handler = commands[cmd];
  if (!handler) {
    console.error(`❌ Unknown command: ${cmd}`);
    showHelp();
    process.exit(1);
  }
  
  try {
    await handler(...args);
  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.code === "object_not_found") {
      console.error("💡 Make sure the page/database is shared with your integration (Share → Add connections)");
    }
    process.exit(1);
  }
};

main();
