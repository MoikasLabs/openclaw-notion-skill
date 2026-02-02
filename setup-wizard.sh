#!/usr/bin/env bash
#
# Setup Wizard for OpenClaw Notion Skill
# Guides you through creating your first database

set -e

echo "🎯 OpenClaw Notion Skill - Setup Wizard"
echo "=========================================="
echo ""

# Check for NOTION_TOKEN
if [ -z "$NOTION_TOKEN" ]; then
    if [ -f "$HOME/.openclaw/.env" ]; then
        export $(cat "$HOME/.openclaw/.env" | grep -v '#' | xargs)
    fi
fi

if [ -z "$NOTION_TOKEN" ]; then
    echo "❌ NOTION_TOKEN not found!"
    echo ""
    echo "Setup steps:"
    echo "1. Go to https://www.notion.so/my-integrations"
    echo "2. Create new integration"
    echo "3. Copy the token (starts with 'secret_')"
    echo "4. Add to ~/.openclaw/.env:"
    echo "   NOTION_TOKEN=secret_your_token_here"
    echo ""
    exit 1
fi

echo "✅ NOTION_TOKEN found"
echo ""

# Test connection
echo "🔄 Testing Notion connection..."
if node notion-cli.js test >/dev/null 2>&1; then
    echo "✅ Connected to Notion!"
else
    echo "❌ Connection failed"
    echo "Make sure you've shared at least one page with your integration"
    echo "In Notion: Share → Add connections → Select your integration"
    exit 1
fi

echo ""
echo "📦 Available Templates:"
echo ""
echo "1. Content Pipeline - Editorial calendar for creators"
echo "2. Project Tracker - Manage projects and deadlines"
echo "3. 3D Print CRM    - Customer and order management"
echo "4. Knowledge Base  - SOPs and documentation"
echo "5. Skip for now    - I'll set up my own"
echo ""

read -p "Which template do you want to set up? (1-5): " choice

case $choice in
    1)
        echo ""
        echo "📝 Content Pipeline Template"
        echo "==========================="
        echo ""
        echo "Steps to create:"
        echo "1. In Notion, create a new database"
        echo "2. Add these properties:"
        echo "   - Title (title)"
        echo "   - Status (select): Idea, Drafting, Review, Scheduled, Posted"
        echo "   - Platform (multi_select): X/Twitter, YouTube, Blog, etc."
        echo "   - Publish Date (date)"
        echo "   - Tags (multi_select)"
        echo ""
        echo "3. Share with your integration"
        echo "4. Copy the database ID from the URL"
        echo "5. Add to ~/.openclaw/.env:"
        echo "   CONTENT_DB_ID=your_database_id"
        echo ""
        cat templates/content-pipeline.json | head -50
        ;;
    
    2)
        echo ""
        echo "🎯 Project Tracker Template"
        echo "=========================="
        echo ""
        echo "Steps to create:"
        echo "1. In Notion, create a new database"
        echo "2. Add these properties:"
        echo "   - Name (title)"
        echo "   - Status (status): Not Started, In Progress, Blocked, Done"
        echo "   - Priority (select): Critical, High, Medium, Low"
        echo "   - Due Date (date)"
        echo "   - Est. Hours (number)"
        echo ""
        echo "3. Share with your integration"
        echo "4. Copy the database ID from the URL"
        echo "5. Add to ~/.openclaw/.env:"
        echo "   PROJECT_DB_ID=your_database_id"
        echo ""
        ;;
    
    3)
        echo ""
        echo "🖨️ 3D Print CRM Template"
        echo "======================="
        echo ""
        echo "Steps to create:"
        echo "1. In Notion, create a new database"
        echo "2. Add these properties:"
        echo "   - Customer Name (title)"
        echo "   - Status (status): Lead, Quote, Ordered, Printing, Shipped"
        echo "   - Email (email)"
        echo "   - Order Value (number)"
        echo "   - Filament Type (multi_select)"
        echo "   - Due Date (date)"
        echo ""
        echo "3. Share with your integration"
        echo "4. Copy the database ID from the URL"
        echo "5. Add to ~/.openclaw/.env:"
        echo "   CRM_DB_ID=your_database_id"
        echo ""
        ;;
    
    4)
        echo ""
        echo "📚 Knowledge Base Template"
        echo "========================="
        echo ""
        echo "Steps to create:"
        echo "1. In Notion, create a new database"
        echo "2. Add these properties:"
        echo "   - Title (title)"
        echo "   - Category (select): SOP, Troubleshooting, Design Pattern"
        echo "   - Status (status): Draft, Published, Outdated"
        echo "   - Tags (multi_select)"
        echo "   - Last Verified (date)"
        echo ""
        echo "3. Share with your integration"
        echo "4. Copy the database ID from the URL"
        echo "5. Add to ~/.openclaw/.env:"
        echo "   KB_DB_ID=your_database_id"
        echo ""
        ;;
    
    5)
        echo ""
        echo "📝 Creating your own database:"
        echo ""
        echo "1. Create a database in Notion"
        echo "2. Share it with your integration (Share → Add connections)"
        echo "3. Get the database ID from the URL"
        echo "4. View the schema:"
        echo "   node notion-cli.js get-database YOUR_DB_ID"
        ;;
    
    *)
        echo "Invalid choice. Run again and select 1-5."
        exit 1
        ;;
esac

echo ""
echo "✨ Next Steps:"
echo ""
echo "1. Finish setting up your Notion database"
echo "2. Share it with your integration"
echo "3. Add the database ID to ~/.openclaw/.env"
echo "4. Start using with OpenClaw!"
echo ""
echo "Example command:"
echo '  node notion-cli.js query-database $DB_ID'
echo ""
echo "For help: cat SKILL.md | less"
echo ""
