# Mixpanel MCP Server

[![npm version](https://badge.fury.io/js/@mendeel%2Fmcp-mixpanel.svg)](https://badge.fury.io/js/@mendeel%2Fmcp-mixpanel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants with comprehensive access to [Mixpanel](https://mixpanel.com/) analytics data. This server enables AI tools like Claude Desktop, Continue.dev, VS Code, Cursor, and other MCP-compatible clients to retrieve and work with Mixpanel data seamlessly.

## 🚀 Key Features

- **Event Analytics**: Get today's top events, event counts, and event properties
- **User Profiles**: Query user profiles and analyze individual user journeys
- **Retention Analysis**: Analyze user retention patterns and cohort behavior
- **Funnel Analysis**: Retrieve and analyze conversion funnels
- **Segmentation**: Segment events and users by properties
- **Custom Queries**: Run custom JQL (JSON Query Language) scripts
- **Multi-Region Support**: Works with both US and EU Mixpanel instances

> **🌍 Important**: If you use **eu.mixpanel.com**, make sure to add `--region eu` or `-r eu` to your commands!

## 📦 Quick Start

### ⚡ Using npx (Recommended)

The fastest way to get started - no installation required!

```bash
# Basic usage with required credentials
npx @mendeel/mcp-mixpanel --username YOUR_USERNAME --password YOUR_PASSWORD --project-id YOUR_PROJECT_ID

# Short form
npx @mendeel/mcp-mixpanel -u YOUR_USERNAME -p YOUR_PASSWORD -i YOUR_PROJECT_ID

# EU region
npx @mendeel/mcp-mixpanel -u YOUR_USERNAME -p YOUR_PASSWORD -i YOUR_PROJECT_ID -r eu

# Using environment variables
export MIXPANEL_SERVICE_ACCOUNT_USERNAME=your_username
export MIXPANEL_SERVICE_ACCOUNT_PASSWORD=your_password
export MIXPANEL_PROJECT_ID=your_project_id
npx @mendeel/mcp-mixpanel
```

**🎯 Try it now**: Run `npx @mendeel/mcp-mixpanel --help` to see all options!

### 🔧 Command Line Options

```bash
mcp-mixpanel [options]

Options:
  --username, -u <username>       Mixpanel service account username
  --password, -p <password>       Mixpanel service account password
  --project-id, -i <project_id>   Default Mixpanel project ID
  --region, -r <region>           Mixpanel region (us or eu) - default: us
  --help, -h                      Show help message  
  --version, -v                   Show version information

Environment Variables:
  MIXPANEL_SERVICE_ACCOUNT_USERNAME    Mixpanel service account username
  MIXPANEL_SERVICE_ACCOUNT_PASSWORD    Mixpanel service account password
  MIXPANEL_PROJECT_ID                  Default Mixpanel project ID
  MIXPANEL_REGION                      Mixpanel region (us or eu) - default: us

Examples:
  npx @mendeel/mcp-mixpanel --help
  npx @mendeel/mcp-mixpanel --version
  npx @mendeel/mcp-mixpanel -u myuser -p mypass -i 12345
  npx @mendeel/mcp-mixpanel -u myuser -p mypass -i 12345 -r eu
  MIXPANEL_PROJECT_ID=12345 npx @mendeel/mcp-mixpanel -u myuser -p mypass -r us
```

## 🔑 Mixpanel Setup

### 📝 Getting Your Credentials (2 minutes)

1. **Go to Mixpanel Organization Settings**:
   - Visit your Mixpanel dashboard
   - Go to Organization Settings → Service Accounts

2. **Create Service Account**:
   - Click "Create Service Account"
   - Give it a name like "MCP Server"
   - **Copy the username and password** - you won't see them again!

3. **Get Your Project ID**:
   - Go to Project Settings
   - Copy your Project ID from the project information

4. **Note Your Region**:
   - **US Region**: Use `-r us` (default) for mixpanel.com
   - **EU Region**: Use `-r eu` for eu.mixpanel.com
   - If you access Mixpanel at eu.mixpanel.com, you MUST use `-r eu`

### 🚀 Using Your Credentials

**Method 1: Command Line (Quick testing)**
```bash
# US region (default)
npx @mendeel/mcp-mixpanel --username your_username --password your_password --project-id your_project_id

# EU region (if you use eu.mixpanel.com)
npx @mendeel/mcp-mixpanel --username your_username --password your_password --project-id your_project_id --region eu
```

**Method 2: Environment Variables (Recommended)**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export MIXPANEL_SERVICE_ACCOUNT_USERNAME=your_username
export MIXPANEL_SERVICE_ACCOUNT_PASSWORD=your_password
export MIXPANEL_PROJECT_ID=your_project_id
export MIXPANEL_REGION=us  # or 'eu' for EU region

# Then simply run:
npx @mendeel/mcp-mixpanel
```

## 🛠️ Editor Integration

### VS Code Integration

#### Method 1: Using Continue Extension

1. **Install Continue Extension**:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Continue" and install it

2. **Configure MCP Server**:
   - Open Command Palette (Ctrl+Shift+P)
   - Type "Continue: Configure" and select it
   - Add this configuration to your settings:

```json
{
  "continue.server": {
    "mcpServers": {
      "mixpanel": {
        "command": "npx",
        "args": ["@mendeel/mcp-mixpanel", "--username", "your_username", "--password", "your_password", "--project-id", "your_project_id", "--region", "us"]
      }
    }
  }
}
```

#### Method 2: Using Claude Extension

1. **Install Claude Extension**:
   - Search for "Claude" in VS Code extensions
   - Install the official Claude extension

2. **Configure MCP Server**:
   - Add to your VS Code settings.json:

```json
{
  "claude.mcpServers": {
    "mixpanel": {
      "command": "npx",
      "args": ["@mendeel/mcp-mixpanel"],
      "env": {
        "MIXPANEL_SERVICE_ACCOUNT_USERNAME": "your_username",
        "MIXPANEL_SERVICE_ACCOUNT_PASSWORD": "your_password",
        "MIXPANEL_PROJECT_ID": "your_project_id",
        "MIXPANEL_REGION": "us"
      }
    }
  }
}
```

### Cursor Integration

#### Method 1: Global Configuration

1. **Open Cursor Settings**:
   - Go to Settings (Cmd/Ctrl + ,)
   - Search for "MCP" or "Model Context Protocol"

2. **Add MCP Server Configuration**:
```json
{
  "mcpServers": {
    "mixpanel": {
      "command": "npx",
              "args": ["@mendeel/mcp-mixpanel", "--username", "your_username", "--password", "your_password", "--project-id", "your_project_id"]
    }
  }
}
```

#### Method 2: Workspace Configuration

Create a `.cursorrules` file in your project root:

```json
{
  "mcpServers": {
    "mixpanel": {
      "command": "npx",
      "args": ["@mendeel/mcp-mixpanel"],
      "env": {
        "MIXPANEL_SERVICE_ACCOUNT_USERNAME": "your_username",
        "MIXPANEL_SERVICE_ACCOUNT_PASSWORD": "your_password",
        "MIXPANEL_PROJECT_ID": "your_project_id",
        "MIXPANEL_REGION": "us"
      }
    }
  }
}
```

### Claude Desktop Integration

Add to your Claude Desktop configuration (`~/.config/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mixpanel": {
      "command": "npx",
              "args": ["@mendeel/mcp-mixpanel", "--username", "your_username", "--password", "your_password", "--project-id", "your_project_id"]
    }
  }
}
```

Or with environment variables:

```json
{
  "mcpServers": {
    "mixpanel": {
      "command": "npx",
      "args": ["@mendeel/mcp-mixpanel"],
      "env": {
        "MIXPANEL_SERVICE_ACCOUNT_USERNAME": "your_username",
        "MIXPANEL_SERVICE_ACCOUNT_PASSWORD": "your_password",
        "MIXPANEL_PROJECT_ID": "your_project_id",
        "MIXPANEL_REGION": "us"
      }
    }
  }
}
```

### Continue.dev Integration

1. **Install Continue.dev**:
   - Download from [continue.dev](https://continue.dev)
   - Install the application

2. **Configure MCP Server**:
   - Open Continue.dev
   - Go to Settings → MCP Servers
   - Add new server:

```json
{
  "name": "mixpanel",
  "command": "npx",
          "args": ["@mendeel/mcp-mixpanel", "--username", "your_username", "--password", "your_password", "--project-id", "your_project_id"]
}
```

## 🎯 Usage Examples

### Getting Today's Top Events

Ask your AI assistant:
```
"Show me today's top events from Mixpanel"
```

The AI can now access real-time event data and identify trending activities.

### Analyzing User Behavior

Ask your AI assistant:
```
"Get the event activity for user ID 12345 from last week"
```

The AI can retrieve detailed user journey data and analyze behavior patterns.

### Retention Analysis

Ask your AI assistant:
```
"What's the 7-day retention for users who signed up in January?"
```

The AI can generate retention reports and provide insights on user engagement.

## 🛠️ Available Tools

The MCP server provides these tools for AI assistants:

### Event Tools

- **`get_today_top_events`** - Get today's most active events
- **`get_top_events`** - Get top events over the last 31 days
- **`aggregate_event_counts`** - Get event counts over time periods
- **`aggregated_event_property_values`** - Analyze specific event properties

### User Profile Tools

- **`profile_event_activity`** - Get individual user event activity
- **`query_profiles`** - Query user profiles with filtering

### Analytics Tools

- **`query_retention_report`** - Analyze user retention
- **`query_funnel_report`** - Get funnel conversion data
- **`list_saved_funnels`** - List available funnels
- **`list_saved_cohorts`** - List user cohorts

### Advanced Tools

- **`custom_jql`** - Run custom JQL queries
- **`query_segmentation_report`** - Segment events by properties
- **`query_insights_report`** - Get saved insights reports

### Example Tool Usage

```typescript
// These tools can be called by AI assistants via MCP protocol

// Get today's top events
{
  "tool": "get_today_top_events",
  "arguments": { "limit": 5 }
}

// Get user activity
{
  "tool": "profile_event_activity",
  "arguments": { 
    "distinct_ids": "[\"user123\"]",
    "from_date": "2024-01-01",
    "to_date": "2024-01-07"
  }
}

// Analyze retention
{
  "tool": "query_retention_report", 
  "arguments": { 
    "from_date": "2024-01-01",
    "to_date": "2024-01-31",
    "born_event": "sign_up"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**"Authentication failed" errors:**
```bash
# Solution: Check your service account credentials
npx @mendeel/mcp-mixpanel --username your_username --password your_password --project-id your_project_id
```

**"Command not found" errors:**
```bash
# Solution: Install Node.js 18+ and ensure npx is available
node --version  # Should be 18+
npx --version   # Should work
```

**"Project not found" errors:**
```bash
# Check your project ID in Mixpanel Project Settings
# Make sure the service account has access to the project
```

**Network/proxy issues:**
```bash
# Set proxy if needed
export HTTP_PROXY=http://your-proxy:8080
export HTTPS_PROXY=http://your-proxy:8080
npx mcp-mixpanel
```

**Editor not recognizing MCP server:**
```bash
# Verify the server is running
npx @mendeel/mcp-mixpanel --help

# Check your editor's MCP configuration
# Ensure the command and args are correct
```

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment variable
DEBUG=* npx @mendeel/mcp-mixpanel --username your_username --password your_password --project-id your_project_id
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- 🐛 [Report Issues](https://github.com/mendel/mixpanel-mcp/issues)
- 💬 [Discussions](https://github.com/mendel/mixpanel-mcp/discussions)
- 📖 [Documentation](https://github.com/mendel/mixpanel-mcp#readme)
- 📦 [npm Package](https://www.npmjs.com/package/@mendeel/mcp-mixpanel)

## 🔗 Related Projects

- [Mixpanel](https://mixpanel.com/) - The analytics platform this server provides access to
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official MCP SDK

## ⭐ Acknowledgments

- [Mixpanel](https://mixpanel.com/) for the powerful analytics platform
- [Anthropic](https://anthropic.com) for the Model Context Protocol specification
- The open source community for inspiration and contributions

---

**Made with ❤️ for the MCP community**

**Star ⭐ this repo if you find it helpful!**