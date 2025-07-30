#!/usr/bin/env node
/**
 * Mixpanel MCP Server
 * 
 * A Model Context Protocol server for Mixpanel analytics.
 * Provides AI assistants with access to Mixpanel data, events, and analytics.
 * 
 * Usage:
 *   npx mcp-mixpanel
 *   npx mcp-mixpanel --username YOUR_USERNAME --password YOUR_PASSWORD --project-id YOUR_PROJECT_ID
 *   npx mcp-mixpanel -u YOUR_USERNAME -p YOUR_PASSWORD -i YOUR_PROJECT_ID
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Parse command line arguments
 */
async function parseArgs() {
  const args = process.argv.slice(2);
  
  // Help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Mixpanel MCP Server

Usage:
  npx mcp-mixpanel [options]

Options:
  --username, -u <username>       Mixpanel service account username
  --password, -p <password>       Mixpanel service account password
  --project-id, -i <project_id>   Default Mixpanel project ID
  --region, -r <region>           Mixpanel region (us or eu) - default: us
  --help, -h                      Show this help message
  --version, -v                   Show version information

Examples:
  npx mcp-mixpanel --username myuser --password mypass --project-id 12345
  npx mcp-mixpanel -u myuser -p mypass -i 12345 -r eu

Environment Variables:
  MIXPANEL_SERVICE_ACCOUNT_USERNAME    Mixpanel service account username
  MIXPANEL_SERVICE_ACCOUNT_PASSWORD    Mixpanel service account password
  MIXPANEL_PROJECT_ID                  Default Mixpanel project ID
  MIXPANEL_REGION                      Mixpanel region (us or eu) - default: us
  LOG_LEVEL                            Log level (debug, info, warn, error) - default: info

For more information, visit: https://github.com/your-org/mcp-mixpanel
`);
    process.exit(0);
  }

  // Version flag
  if (args.includes('--version') || args.includes('-v')) {
    // Read version from package.json
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const packagePath = path.join(__dirname, '..', 'package.json');
      
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      console.log(`mcp-mixpanel v${packageJson.version}`);
    } catch (error) {
      console.log('mcp-mixpanel v1.0.0');
    }
    process.exit(0);
  }

  // Parse username
  const usernameIndex = args.findIndex(arg => arg === '--username' || arg === '-u');
  let username = null;
  
  if (usernameIndex !== -1 && args[usernameIndex + 1]) {
    username = args[usernameIndex + 1];
  } else if (process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME) {
    username = process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME;
  }

  // Parse password
  const passwordIndex = args.findIndex(arg => arg === '--password' || arg === '-p');
  let password = null;
  
  if (passwordIndex !== -1 && args[passwordIndex + 1]) {
    password = args[passwordIndex + 1];
  } else if (process.env.MIXPANEL_SERVICE_ACCOUNT_PASSWORD) {
    password = process.env.MIXPANEL_SERVICE_ACCOUNT_PASSWORD;
  }

  // Parse project ID
  const projectIdIndex = args.findIndex(arg => arg === '--project-id' || arg === '-i');
  let projectId = null;
  
  if (projectIdIndex !== -1 && args[projectIdIndex + 1]) {
    projectId = args[projectIdIndex + 1];
  } else if (process.env.MIXPANEL_PROJECT_ID) {
    projectId = process.env.MIXPANEL_PROJECT_ID;
  }

  // Parse region
  const regionIndex = args.findIndex(arg => arg === '--region' || arg === '-r');
  let region = 'us'; // default value
  
  if (regionIndex !== -1 && args[regionIndex + 1]) {
    region = args[regionIndex + 1];
  } else if (process.env.MIXPANEL_REGION) {
    region = process.env.MIXPANEL_REGION;
  }

  // Validate region
  if (!['us', 'eu'].includes(region)) {
    console.error(`Error: Invalid region '${region}'. Must be 'us' or 'eu'.`);
    process.exit(1);
  }

  return { 
    username, 
    password, 
    projectId, 
    region: region as 'us' | 'eu'
  };
}

const configSchema = z.object({
  service_account_username: z.string().describe("Mixpanel service account username for API authentication"),
  service_account_password: z.string().describe("Mixpanel service account password for API authentication"),
  project_id: z.string().describe("Default Mixpanel project ID to use when not specified in tool calls"),
  region: z.enum(["us", "eu"]).default("us").describe("Mixpanel region - 'us' for mixpanel.com or 'eu' for eu.mixpanel.com"),
});

/**
 * Main function to start the MCP server
 */
async function main() {
  try {
    console.error('Starting Mixpanel MCP Server...');

    // Parse command line arguments and environment variables
    const args = await parseArgs();

    // Validate required arguments
    if (!args.username) {
      console.error("Error: Mixpanel service account username is required. Use --username or set MIXPANEL_SERVICE_ACCOUNT_USERNAME environment variable.");
      process.exit(1);
    }

    if (!args.password) {
      console.error("Error: Mixpanel service account password is required. Use --password or set MIXPANEL_SERVICE_ACCOUNT_PASSWORD environment variable.");
      process.exit(1);
    }

    if (!args.projectId) {
      console.error("Error: Mixpanel project ID is required. Use --project-id or set MIXPANEL_PROJECT_ID environment variable.");
      process.exit(1);
    }

    // Create config object
    const config = {
      service_account_username: args.username,
      service_account_password: args.password,
      project_id: args.projectId,
      region: args.region
    };

    // Validate config with schema
    const validatedConfig = configSchema.parse(config);
    
    // Initialize the MCP server with metadata and capabilities
    const server = new Server(
      {
        name: "mcp-mixpanel",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    const SERVICE_ACCOUNT_USER_NAME = validatedConfig.service_account_username;
    const SERVICE_ACCOUNT_PASSWORD = validatedConfig.service_account_password;
    const DEFAULT_PROJECT_ID = validatedConfig.project_id;
    const MIXPANEL_REGION = validatedConfig.region;

    const MIXPANEL_BASE_URL = MIXPANEL_REGION === "eu" ? "https://eu.mixpanel.com/api/query" : "https://mixpanel.com/api/query";

    // Setup request handlers
    setupHandlers(server, {
      SERVICE_ACCOUNT_USER_NAME,
      SERVICE_ACCOUNT_PASSWORD,
      DEFAULT_PROJECT_ID,
      MIXPANEL_BASE_URL
    });

    // Start server using stdio transport
    const transport = new StdioServerTransport();
    
    console.error('Transport initialized: stdio');

    await server.connect(transport);
    
    console.error('Server started successfully');

  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

// Setup handlers function
function setupHandlers(server: Server, config: {
  SERVICE_ACCOUNT_USER_NAME: string;
  SERVICE_ACCOUNT_PASSWORD: string;
  DEFAULT_PROJECT_ID: string;
  MIXPANEL_BASE_URL: string;
}) {
  const { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL } = config;

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // Event Tools
        {
          name: "get_today_top_events",
          description: "Get today's top events from Mixpanel. Useful for quickly identifying the most active events happening today, spotting trends, and monitoring real-time user activity.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              type: {
                type: "string",
                enum: ["general", "average", "unique"],
                description: "The type of events to fetch, either general, average, or unique, defaults to general"
              },
              limit: {
                type: "number",
                description: "Maximum number of events to return"
              }
            }
          }
        },
        {
          name: "get_top_events",
          description: "Get a list of the most common events over the last 31 days. Useful for identifying key user actions, prioritizing feature development, and understanding overall platform usage patterns.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              type: {
                type: "string",
                enum: ["general", "average", "unique"],
                description: "The type of events to fetch, either general, average, or unique, defaults to general"
              },
              limit: {
                type: "number",
                description: "Maximum number of events to return"
              }
            }
          }
        },
        {
          name: "aggregate_event_counts",
          description: "Get event counts over time periods. Useful for analyzing event volume trends and identifying patterns in user activity over time.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              event: {
                type: "string",
                description: "The event name to get counts for"
              },
              from_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to begin querying from (inclusive)"
              },
              to_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to query to (inclusive)"
              },
              unit: {
                type: "string",
                enum: ["hour", "day", "week", "month"],
                description: "The time unit for aggregation, defaults to day"
              }
            },
            required: ["event", "from_date", "to_date"]
          }
        },
        {
          name: "aggregated_event_property_values",
          description: "Analyze specific event properties and their values. Useful for understanding property distributions and identifying common values.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              event: {
                type: "string",
                description: "The event name to analyze properties for"
              },
              property: {
                type: "string",
                description: "The property name to get values for"
              },
              from_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to begin querying from (inclusive)"
              },
              to_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to query to (inclusive)"
              },
              limit: {
                type: "number",
                description: "Maximum number of property values to return"
              }
            },
            required: ["event", "property", "from_date", "to_date"]
          }
        },
        
        // User Profile Tools
        {
          name: "profile_event_activity",
          description: "Get data for a profile's event activity. Useful for understanding individual user journeys, troubleshooting user-specific issues, and analyzing behavior patterns of specific users.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              workspace_id: {
                type: "string",
                description: "The ID of the workspace if applicable"
              },
              distinct_ids: {
                type: "string",
                description: "A JSON array as a string representing the distinct_ids to return activity feeds for. Example: [\"12a34aa567eb8d-9ab1c26f345b67-89123c45-6aeaa7-89f12af345f678\"]"
              },
              from_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to begin querying from (inclusive)"
              },
              to_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to query to (inclusive)"
              }
            },
            required: ["distinct_ids", "from_date", "to_date"]
          }
        },
        {
          name: "query_profiles",
          description: "Query user profiles with filtering. Useful for finding users based on profile properties and analyzing user segments.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              where: {
                type: "string",
                description: "JSON string representing the filter conditions for profiles"
              },
              select: {
                type: "string",
                description: "JSON array string of properties to return. If not specified, returns all properties"
              },
              limit: {
                type: "number",
                description: "Maximum number of profiles to return"
              }
            }
          }
        },

        // Analytics Tools
        {
          name: "query_retention_report",
          description: "Analyze user retention patterns. Useful for understanding how well you retain users over time and identifying cohort behavior.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              from_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to begin querying from (inclusive)"
              },
              to_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to query to (inclusive)"
              },
              born_event: {
                type: "string",
                description: "The event that defines when users are 'born' for retention analysis"
              },
              event: {
                type: "string",
                description: "The event to measure retention for (optional, defaults to any event)"
              },
              born_where: {
                type: "string",
                description: "JSON string representing additional filters for the born event"
              },
              where: {
                type: "string",
                description: "JSON string representing additional filters for the retention event"
              },
              interval: {
                type: "string",
                enum: ["day", "week", "month"],
                description: "The time interval for retention analysis, defaults to day"
              },
              interval_count: {
                type: "number",
                description: "Number of intervals to analyze, defaults to 30"
              }
            },
            required: ["from_date", "to_date", "born_event"]
          }
        },
        {
          name: "query_funnel_report",
          description: "Get funnel conversion data. Useful for analyzing conversion rates through multi-step user flows and identifying drop-off points.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              from_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to begin querying from (inclusive)"
              },
              to_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to query to (inclusive)"
              },
              events: {
                type: "string",
                description: "JSON array string of events that make up the funnel steps"
              },
              funnel_window: {
                type: "number",
                description: "Number of days users have to complete the funnel"
              },
              interval: {
                type: "string",
                enum: ["day", "week", "month"],
                description: "The time interval for funnel analysis"
              }
            },
            required: ["from_date", "to_date", "events"]
          }
        },
        {
          name: "list_saved_funnels",
          description: "List available saved funnels in the project. Useful for discovering existing funnel analyses and getting funnel IDs for further analysis.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              }
            }
          }
        },
        {
          name: "list_saved_cohorts",
          description: "List user cohorts in the project. Useful for discovering existing user segments and getting cohort IDs for analysis.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              }
            }
          }
        },

        // Advanced Tools
        {
          name: "custom_jql",
          description: "Run custom JQL (JSON Query Language) queries. Useful for advanced analytics and custom data analysis beyond standard reports.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              script: {
                type: "string",
                description: "The JQL script to execute"
              }
            },
            required: ["script"]
          }
        },
        {
          name: "query_segmentation_report",
          description: "Segment events by properties. Useful for analyzing how different user segments behave and comparing event patterns across groups.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              event: {
                type: "string",
                description: "The event to segment"
              },
              from_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to begin querying from (inclusive)"
              },
              to_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to query to (inclusive)"
              },
              on: {
                type: "string",
                description: "The property to segment by"
              },
              where: {
                type: "string",
                description: "JSON string representing additional filters"
              },
              unit: {
                type: "string",
                enum: ["hour", "day", "week", "month"],
                description: "The time unit for segmentation, defaults to day"
              }
            },
            required: ["event", "from_date", "to_date", "on"]
          }
        },
        {
          name: "query_insights_report",
          description: "Get saved insights reports. Useful for accessing pre-configured analytics reports and dashboards.",
          inputSchema: {
            type: "object",
            properties: {
              project_id: {
                type: "string",
                description: "The Mixpanel project ID. Optional since it has a default."
              },
              report_id: {
                type: "string",
                description: "The ID of the saved insights report to retrieve"
              },
              from_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to begin querying from (inclusive)"
              },
              to_date: {
                type: "string",
                description: "The date in yyyy-mm-dd format to query to (inclusive)"
              }
            },
            required: ["report_id"]
          }
        }
      ]
    };
  });

  // Tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      // Event Tools
      case "get_today_top_events":
        return await handleGetTodayTopEvents(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
      
      case "get_top_events":
        return await handleGetTopEvents(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
        
      case "aggregate_event_counts":
        return await handleAggregateEventCounts(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
        
      case "aggregated_event_property_values":
        return await handleAggregatedEventPropertyValues(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });

      // User Profile Tools
      case "profile_event_activity":
        return await handleProfileEventActivity(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
        
      case "query_profiles":
        return await handleQueryProfiles(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });

      // Analytics Tools
      case "query_retention_report":
        return await handleQueryRetentionReport(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
        
      case "query_funnel_report":
        return await handleQueryFunnelReport(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
        
      case "list_saved_funnels":
        return await handleListSavedFunnels(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
        
      case "list_saved_cohorts":
        return await handleListSavedCohorts(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });

      // Advanced Tools
      case "custom_jql":
        return await handleCustomJQL(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
        
      case "query_segmentation_report":
        return await handleQuerySegmentationReport(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });
        
      case "query_insights_report":
        return await handleQueryInsightsReport(args, { SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, DEFAULT_PROJECT_ID, MIXPANEL_BASE_URL });

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}

// Tool handlers
async function handleGetTodayTopEvents(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID, type = "general", limit = 10 } = args;
  
  try {
    // Create authorization header using base64 encoding of credentials
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    // Construct URL with query parameters
    const url = `${config.MIXPANEL_BASE_URL}/events/top?project_id=${project_id}&type=${type}${limit ? `&limit=${limit}` : ''}`;
    
    // Set up request options
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    // Make the API request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error fetching Mixpanel events:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching Mixpanel events: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleGetTopEvents(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID, type = "general", limit = 10 } = args;
  
  try {
    // Create authorization header using base64 encoding of credentials
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    // Construct URL with query parameters
    const url = `${config.MIXPANEL_BASE_URL}/events/names?project_id=${project_id}&type=${type}${limit ? `&limit=${limit}` : ''}`;
    
    // Set up request options
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    // Make the API request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error fetching Mixpanel events:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching Mixpanel events: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleProfileEventActivity(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID, workspace_id, distinct_ids, from_date, to_date } = args;
  
  try {
    // Create authorization header using base64 encoding of credentials
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    // Construct URL with query parameters
    let url = `${config.MIXPANEL_BASE_URL}/stream/query?project_id=${project_id}&distinct_ids=${encodeURIComponent(distinct_ids)}&from_date=${from_date}&to_date=${to_date}`;
    
    // Add optional workspace_id if provided
    if (workspace_id) {
      url += `&workspace_id=${workspace_id}`;
    }
    
    // Set up request options
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    // Make the API request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching profile event activity:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching profile event activity: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

// Additional tool handlers for the new tools

async function handleAggregateEventCounts(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID, event, from_date, to_date, unit = "day" } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    const url = `${config.MIXPANEL_BASE_URL}/events?project_id=${project_id}&event=${encodeURIComponent(event)}&from_date=${from_date}&to_date=${to_date}&unit=${unit}`;
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error fetching event counts:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching event counts: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleAggregatedEventPropertyValues(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID, event, property, from_date, to_date, limit = 100 } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    const url = `${config.MIXPANEL_BASE_URL}/events/properties/values?project_id=${project_id}&event=${encodeURIComponent(event)}&name=${encodeURIComponent(property)}&from_date=${from_date}&to_date=${to_date}&limit=${limit}`;
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error fetching event property values:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error fetching event property values: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleQueryProfiles(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID, where, select, limit = 100 } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    let url = `${config.MIXPANEL_BASE_URL}/engage?project_id=${project_id}`;
    
    if (where) {
      url += `&where=${encodeURIComponent(where)}`;
    }
    if (select) {
      url += `&select=${encodeURIComponent(select)}`;
    }
    if (limit) {
      url += `&limit=${limit}`;
    }
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error querying profiles:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error querying profiles: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleQueryRetentionReport(args: any, config: any) {
  const { 
    project_id = config.DEFAULT_PROJECT_ID, 
    from_date, 
    to_date, 
    born_event, 
    event, 
    born_where, 
    where, 
    interval = "day", 
    interval_count = 30 
  } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    let url = `${config.MIXPANEL_BASE_URL}/retention?project_id=${project_id}&from_date=${from_date}&to_date=${to_date}&born_event=${encodeURIComponent(born_event)}&interval=${interval}&interval_count=${interval_count}`;
    
    if (event) {
      url += `&event=${encodeURIComponent(event)}`;
    }
    if (born_where) {
      url += `&born_where=${encodeURIComponent(born_where)}`;
    }
    if (where) {
      url += `&where=${encodeURIComponent(where)}`;
    }
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error querying retention report:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error querying retention report: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleQueryFunnelReport(args: any, config: any) {
  const { 
    project_id = config.DEFAULT_PROJECT_ID, 
    from_date, 
    to_date, 
    events, 
    funnel_window = 14,
    interval = "day"
  } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    const url = `${config.MIXPANEL_BASE_URL}/funnels?project_id=${project_id}&from_date=${from_date}&to_date=${to_date}&events=${encodeURIComponent(events)}&funnel_window=${funnel_window}&interval=${interval}`;
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error querying funnel report:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error querying funnel report: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleListSavedFunnels(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    const url = `${config.MIXPANEL_BASE_URL}/funnels/list?project_id=${project_id}`;
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error listing saved funnels:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error listing saved funnels: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleListSavedCohorts(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    const url = `${config.MIXPANEL_BASE_URL}/cohorts/list?project_id=${project_id}`;
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error listing saved cohorts:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error listing saved cohorts: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleCustomJQL(args: any, config: any) {
  const { project_id = config.DEFAULT_PROJECT_ID, script } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    const options = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        project_id: project_id,
        script: script
      })
    };
    
    const response = await fetch(`${config.MIXPANEL_BASE_URL}/jql`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error executing custom JQL:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error executing custom JQL: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleQuerySegmentationReport(args: any, config: any) {
  const { 
    project_id = config.DEFAULT_PROJECT_ID, 
    event, 
    from_date, 
    to_date, 
    on, 
    where, 
    unit = "day" 
  } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    let url = `${config.MIXPANEL_BASE_URL}/segmentation?project_id=${project_id}&event=${encodeURIComponent(event)}&from_date=${from_date}&to_date=${to_date}&on=${encodeURIComponent(on)}&unit=${unit}`;
    
    if (where) {
      url += `&where=${encodeURIComponent(where)}`;
    }
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error querying segmentation report:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error querying segmentation report: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

async function handleQueryInsightsReport(args: any, config: any) {
  const { 
    project_id = config.DEFAULT_PROJECT_ID, 
    report_id, 
    from_date, 
    to_date 
  } = args;
  
  try {
    const credentials = `${config.SERVICE_ACCOUNT_USER_NAME}:${config.SERVICE_ACCOUNT_PASSWORD}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    let url = `${config.MIXPANEL_BASE_URL}/insights?project_id=${project_id}&report_id=${report_id}`;
    
    if (from_date) {
      url += `&from_date=${from_date}`;
    }
    if (to_date) {
      url += `&to_date=${to_date}`;
    }
    
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${encodedCredentials}`
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error: unknown) {
    console.error("Error querying insights report:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error querying insights report: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled startup error', error);
  process.exit(1);
});