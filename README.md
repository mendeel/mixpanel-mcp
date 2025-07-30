# Mixpanel MCP
[![smithery badge](https://smithery.ai/badge/@dragonkhoi/mixpanel-mcp)](https://smithery.ai/server/@dragonkhoi/mixpanel-mcp)

A stdio MCP server that interfaces with the Mixpanel API, allowing you to talk to your Mixpanel events data from any MCP client like Cursor or Claude Desktop. Query events data, retention, and funnels. Great for on-demand look ups like: "What's the weekly retention for users in the Feb 1 cohort?"

<a href="https://glama.ai/mcp/servers/3ymkqswmp4">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/3ymkqswmp4/badge" alt="mixpanel MCP server" />
</a>

I am adding more coverage of the Mixpanel API over time, let me know which tools you need or just open a PR.

## Prerequisites
Make sure to go to your Mixpanel Organization Settings to set up a [Mixpanel Service Account](https://developer.mixpanel.com/reference/service-accounts), get the username, password, and your project ID (in Mixpanel Project Settings).

## Installation

### Option 1: Installing via Smithery (Recommended)

To install mixpanel-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@dragonkhoi/mixpanel-mcp):

```bash
npx -y @smithery/cli install @mendeel/mixpanel-mcp --client claude
```

### Option 2: Manual Installation for Claude Desktop

Add this to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "mixpanel": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/mixpanel-mcp/src/index.ts"],
      "env": {
        "MIXPANEL_SERVICE_ACCOUNT_USERNAME": "your-username",
        "MIXPANEL_SERVICE_ACCOUNT_PASSWORD": "your-password",
        "MIXPANEL_PROJECT_ID": "your-project-id",
        "MIXPANEL_REGION": "us"
      }
    }
  }
}
```

Or using command line arguments:
```json
{
  "mcpServers": {
    "mixpanel": {
      "command": "npx",
      "args": [
        "tsx", 
        "/ABSOLUTE/PATH/TO/mixpanel-mcp/src/index.ts",
        "--username", "your-username",
        "--password", "your-password", 
        "--project-id", "your-project-id",
        "--region", "us"
      ]
    }
  }
}
```

### Option 3: Clone and Run Locally

1. Clone this repository:
```bash
git clone https://github.com/your-org/mixpanel-mcp.git
cd mixpanel-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Run the server:
```bash
# Using environment variables
export MIXPANEL_SERVICE_ACCOUNT_USERNAME=your-username
export MIXPANEL_SERVICE_ACCOUNT_PASSWORD=your-password
export MIXPANEL_PROJECT_ID=your-project-id
export MIXPANEL_REGION=us
npm start

# Or using command line arguments
npm start -- --username your-username --password your-password --project-id your-project-id --region us

# Or run directly
./src/index.ts --username your-username --password your-password --project-id your-project-id
```

## Configuration Options

The server supports the following configuration options:

### Command Line Arguments:
- `--username, -u` - Mixpanel service account username
- `--password, -p` - Mixpanel service account password
- `--project-id, -i` - Default Mixpanel project ID
- `--region, -r` - Mixpanel region (`us` or `eu`, defaults to `us`)
- `--help, -h` - Show help message
- `--version, -v` - Show version

### Environment Variables:
- `MIXPANEL_SERVICE_ACCOUNT_USERNAME` - Mixpanel service account username
- `MIXPANEL_SERVICE_ACCOUNT_PASSWORD` - Mixpanel service account password
- `MIXPANEL_PROJECT_ID` - Default Mixpanel project ID
- `MIXPANEL_REGION` - Mixpanel region (`us` or `eu`)

## Docker Usage

Build and run with Docker:

```bash
# Build the image
docker build -t mixpanel-mcp .

# Run with environment variables
docker run -e MIXPANEL_SERVICE_ACCOUNT_USERNAME=your-username \
           -e MIXPANEL_SERVICE_ACCOUNT_PASSWORD=your-password \
           -e MIXPANEL_PROJECT_ID=your-project-id \
           -e MIXPANEL_REGION=us \
           mixpanel-mcp

# Or run with command arguments
docker run mixpanel-mcp --username your-username --password your-password --project-id your-project-id
```

## Examples
- Ask about retention numbers

<img width="500" alt="IMG_3675" src="https://github.com/user-attachments/assets/5999958e-d4f6-4824-b226-50ad416ab064" />


- Ask for an overview of events

<img width="500" alt="IMG_9968" src="https://github.com/user-attachments/assets/c05cd932-5ca8-4a5b-a31c-7da2c4f2fa77" />