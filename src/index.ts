#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export const configSchema = z.object({
	serviceAccountUserName: z
		.string()
		.describe(
			"Mixpanel service account username",
		),
	serviceAccountPassword: z
		.string()
		.describe(
			"Mixpanel service account password",
		),
	defaultProjectId: z
		.string()
		.describe(
			"Mixpanel default project ID",
		),
	region: z
		.string()
		.describe(
			"Mixpanel region",
		),
})

export default function ({ config }: { config: z.infer<typeof configSchema> }) {
  const server = new McpServer({
    name: "mixpanel",
    version: "1.0.0"
  });

  const args = process.argv.slice(2);

  const SERVICE_ACCOUNT_USER_NAME = process.env.SERVICE_ACCOUNT_USER_NAME || args[0];
  const SERVICE_ACCOUNT_PASSWORD = process.env.SERVICE_ACCOUNT_PASSWORD || args[1];
  const DEFAULT_PROJECT_ID = process.env.DEFAULT_PROJECT_ID || args[2];
  const MIXPANEL_REGION = process.env.MIXPANEL_REGION || args[3] || "us";

  if (!SERVICE_ACCOUNT_USER_NAME || !SERVICE_ACCOUNT_PASSWORD || !DEFAULT_PROJECT_ID) {
    console.error("Please provide a Mixpanel service account username, password, and project ID. You can set SERVICE_ACCOUNT_USER_NAME, SERVICE_ACCOUNT_PASSWORD, and DEFAULT_PROJECT_ID environment variables, or pass them as command-line arguments.");
    process.exit(1);
  }

  const MIXPANEL_BASE_URL = MIXPANEL_REGION === "eu" ? "https://eu.mixpanel.com/api/query" : "https://mixpanel.com/api/query";

  server.tool(
    "get_today_top_events",
    "Get today's top events from Mixpanel. Useful for quickly identifying the most active events happening today, spotting trends, and monitoring real-time user activity.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      type: z.enum(["general", "average", "unique"]).describe("The type of events to fetch, either general, average, or unique, defaults to general").optional(),
      limit: z.number().optional().describe("Maximum number of events to return"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, type = "general", limit = 10 }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct URL with query parameters
        const url = `${MIXPANEL_BASE_URL}/events/top?project_id=${project_id}&type=${type}${limit ? `&limit=${limit}` : ''}`;
        
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
  )

  server.tool(
    "profile_event_activity",
    "Get data for a profile's event activity. Useful for understanding individual user journeys, troubleshooting user-specific issues, and analyzing behavior patterns of specific users.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().describe("The ID of the workspace if applicable").optional(),
      distinct_ids: z.string().describe("A JSON array as a string representing the `distinct_ids` to return activity feeds for. Example: `[\"12a34aa567eb8d-9ab1c26f345b67-89123c45-6aeaa7-89f12af345f678\"]`"),
      from_date: z.string().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, workspace_id, distinct_ids, from_date, to_date }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct URL with query parameters
        let url = `${MIXPANEL_BASE_URL}/stream/query?project_id=${project_id}&distinct_ids=${encodeURIComponent(distinct_ids)}&from_date=${from_date}&to_date=${to_date}`;
        
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
  );

  server.tool(
    "get_top_events",
    "Get a list of the most common events over the last 31 days. Useful for identifying key user actions, prioritizing feature development, and understanding overall platform usage patterns.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      type: z.enum(["general", "average", "unique"]).describe("The type of events to fetch, either general, average, or unique, defaults to general").optional(),
      limit: z.number().optional().describe("Maximum number of events to return"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, type = "general", limit = 10 }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct URL with query parameters
        const url = `${MIXPANEL_BASE_URL}/events/names?project_id=${project_id}&type=${type}${limit ? `&limit=${limit}` : ''}`;
        
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
  )

  server.tool(
    "aggregate_event_counts",
    "Get unique, general, or average data for a set of events over N days, weeks, or months. Useful for trend analysis, comparing event performance over time, and creating time-series visualizations.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      event: z.string().describe("The event or events that you wish to get data for, a string encoded as a JSON array. Example format: \"[\"play song\", \"log in\", \"add playlist\"]\""),
      type: z.enum(["general", "unique", "average"]).describe("The type of data to fetch, either general, unique, or average, defaults to general").optional(),
      unit: z.enum(["minute", "hour", "day", "week", "month"]).describe("The level of granularity of the data you get back"),
      interval: z.number().optional().describe("The number of units to return data for. Specify either interval or from_date and to_date"),
      from_date: z.string().optional().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().optional().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, event, type = "general", unit, interval, from_date, to_date }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Validate parameters
        if (!interval && (!from_date || !to_date)) {
          throw new Error("You must specify either interval or both from_date and to_date");
        }
        
        // Parse events to ensure it's a valid JSON array
        let parsedEvents;
        try {
          parsedEvents = JSON.parse(event);
          if (!Array.isArray(parsedEvents)) {
            throw new Error("Events must be a JSON array");
          }
        } catch (e: any) {
          throw new Error(`Invalid events format: ${e.message}`);
        }
        
        // Build query parameters
        const queryParams = new URLSearchParams({
          project_id: project_id || '',
          type: type,
          unit: unit
        });
        
        // Add either interval or date range
        if (interval) {
          queryParams.append('interval', interval.toString());
        } else {
          queryParams.append('from_date', from_date || '');
          queryParams.append('to_date', to_date || '');
        }
        
        // Add events parameter
        queryParams.append('event', event);
        
        // Construct URL with query parameters
        const url = `${MIXPANEL_BASE_URL}/events?${queryParams.toString()}`;
        
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
        console.error("Error fetching Mixpanel event counts:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Mixpanel event counts: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  )

  server.tool(
    "aggregated_event_property_values",
    "Get unique, general, or average data for a single event and property over days, weeks, or months. Useful for analyzing how specific properties affect event performance, segmenting users, and identifying valuable user attributes.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      event: z.string().describe("The event that you wish to get data for (a single event name, not an array)"),
      name: z.string().describe("The name of the property you would like to get data for"),
      values: z.string().optional().describe("The specific property values to get data for, encoded as a JSON array. Example: \"[\"female\", \"unknown\"]\""),
      type: z.enum(["general", "unique", "average"]).describe("The analysis type - general, unique, or average events, defaults to general").optional(),
      unit: z.enum(["minute", "hour", "day", "week", "month"]).describe("The level of granularity of the data (minute, hour, day, week, or month)"),
      interval: z.number().optional().describe("The number of units to return data for. Specify either interval or from_date and to_date"),
      from_date: z.string().optional().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().optional().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
      limit: z.number().optional().describe("The maximum number of values to return (default: 255)"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, event, name, values, type = "general", unit, interval, from_date, to_date, limit }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Validate parameters
        if (!interval && (!from_date || !to_date)) {
          throw new Error("You must specify either interval or both from_date and to_date");
        }
        
        // Parse values if provided
        let parsedValues;
        if (values) {
          try {
            parsedValues = JSON.parse(values);
            if (!Array.isArray(parsedValues)) {
              throw new Error("Values must be a JSON array");
            }
          } catch (e) {
            throw new Error(`Invalid values format: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
        
        // Build query parameters
        const queryParams = new URLSearchParams({
          project_id: project_id || '',
          event: event,
          name: name,
          type: type,
          unit: unit
        });
        
        // Add values if provided
        if (values) {
          queryParams.append('values', values);
        }
        
        // Add either interval or date range
        if (interval) {
          queryParams.append('interval', interval.toString());
        } else {
          queryParams.append('from_date', from_date || '');
          queryParams.append('to_date', to_date || '');
        }
        
        // Add limit if provided
        if (limit) {
          queryParams.append('limit', limit.toString());
        }
        
        // Construct URL with query parameters
        const url = `${MIXPANEL_BASE_URL}/events/properties?${queryParams.toString()}`;
        
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
        console.error("Error fetching Mixpanel event property values:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Mixpanel event property values: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  )

  server.tool(
    "query_insights_report",
    "Get data from your Insights reports. Useful for accessing saved analyses, sharing standardized metrics across teams, and retrieving complex pre-configured visualizations.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().optional().describe("The ID of the workspace if applicable"),
      bookmark_id: z.string().describe("The ID of your Insights report"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, workspace_id, bookmark_id }) => {
      try {
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        const queryParams = new URLSearchParams({
          project_id: project_id || '',
          bookmark_id: bookmark_id
        });
        
        if (workspace_id) {
          queryParams.append('workspace_id', workspace_id);
        }
        
        const url = `${MIXPANEL_BASE_URL}/insights?${queryParams.toString()}`;
        
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
        console.error("Error fetching Mixpanel insights:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Mixpanel insights: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "query_funnel_report",
    "Get data for a funnel based on a funnel_id. Useful for analyzing user conversion paths, identifying drop-off points in user journeys, and optimizing multi-step processes. Funnel IDs should be retrieved using the list_saved_funnels tool. ",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().optional().describe("The ID of the workspace if applicable"),
      funnel_id: z.string().describe("The Mixpanel funnel ID that you wish to get data for"),
      from_date: z.string().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
      length: z.number().optional().describe("The number of units each user has to complete the funnel"),
      length_unit: z.enum(["day", "hour", "minute", "second"]).optional().describe("The unit applied to the length parameter"),
      interval: z.number().optional().describe("The number of days you want each bucket to contain"),
      unit: z.enum(["day", "week", "month"]).optional().describe("Alternate way of specifying interval"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, workspace_id, funnel_id, from_date, to_date, length, length_unit, interval, unit }) => {
      try {
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        const queryParams = new URLSearchParams({
          project_id: project_id || '',
          funnel_id: funnel_id,
          from_date: from_date,
          to_date: to_date
        });
        
        if (workspace_id) queryParams.append('workspace_id', workspace_id);
        if (length) queryParams.append('length', length.toString());
        if (length_unit) queryParams.append('length_unit', length_unit);
        if (interval) queryParams.append('interval', interval.toString());
        if (unit) queryParams.append('unit', unit);
        
        const url = `${MIXPANEL_BASE_URL}/funnels?${queryParams.toString()}`;
        
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
        console.error("Error fetching Mixpanel funnel data:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Mixpanel funnel data: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "list_saved_funnels",
    "Get the names and IDs of your saved funnels. Useful for discovering available funnels for analysis and retrieving funnel IDs needed for the query_funnel_report tool.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().optional().describe("The ID of the workspace if applicable"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, workspace_id }) => {
      try {
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        const queryParams = new URLSearchParams({
          project_id: project_id || ''
        });
        
        if (workspace_id) {
          queryParams.append('workspace_id', workspace_id);
        }
        
        const url = `${MIXPANEL_BASE_URL}/funnels/list?${queryParams.toString()}`;
        
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
        console.error("Error fetching Mixpanel funnels list:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Mixpanel funnels list: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "list_saved_cohorts",
    "Get all cohorts in a given project. Useful for discovering user segments, planning targeted analyses, and retrieving cohort IDs for filtering in other reports.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().optional().describe("The ID of the workspace if applicable"),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, workspace_id }) => {
      try {
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        const queryParams = new URLSearchParams({
          project_id: project_id || ''
        });
        
        if (workspace_id) {
          queryParams.append('workspace_id', workspace_id);
        }
        
        const url = `${MIXPANEL_BASE_URL}/cohorts/list?${queryParams.toString()}`;
        
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
        console.error("Error fetching Mixpanel cohorts list:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Mixpanel cohorts list: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "query_retention_report",
    "Get data from your Retention reports. Useful for analyzing user engagement over time, measuring product stickiness, and understanding how well your product retains users after specific actions. Only use params interval or unit, not both.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().optional().describe("The ID of the workspace if applicable"),
      from_date: z.string().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
      retention_type: z.enum(["birth", "compounded"]).optional().describe("Type of retention: 'birth' (first time) or 'compounded' (recurring). Defaults to 'birth'"),
      born_event: z.string().optional().describe("The first event a user must do to be counted in a birth retention cohort, required if retention_type is 'birth'. Can use $mp_web_page_view as the born_event for general cases."),
      event: z.string().optional().describe("The event to generate returning counts for. If not specified, looks across all events"),
      born_where: z.string().optional().describe(`An expression to filter born_events by based on the grammar: <expression> ::= 'properties["' <property> '"]'
                  | <expression> <binary op> <expression>
                  | <unary op> <expression>
                  | <math op> '(' <expression> ')'
                  | <string literal>
    <binary op> ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' |
                    '>' | '>=' | '<' | '<=' | 'in' | 'and' | 'or'
                  | <unary op> ::= '-' | 'not'`),
      return_where: z.string().optional().describe(`An expression to filter return events by based on the grammar: <expression> ::= 'properties["' <property> '"]'
                  | <expression> <binary op> <expression>
                  | <unary op> <expression>
                  | <math op> '(' <expression> ')'
                  | <string literal>
    <binary op> ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' |
                    '>' | '>=' | '<' | '<=' | 'in' | 'and' | 'or'
                  | <unary op> ::= '-' | 'not'`),
      interval: z.number().optional().describe("The number of units per individual bucketed interval. Default is 1. DO NOT USE IF ALREADY PROVIDING UNIT."),
      interval_count: z.number().optional().describe("The number of individual buckets/intervals to return. Default is 1. DO NOT USE IF ALREADY PROVIDING UNIT."),
      unit: z.enum(["day", "week", "month"]).optional().describe("The interval unit: 'day' (eg use if asked for D7 or D30), 'week' (eg use if asked for W12), or 'month' (eg use if asked for M6). Default is 'day'. DO NOT USE IF ALREADY PROVIDING INTERVAL."),
      on: z.string().optional().describe("The property expression to segment the second event on"),
      limit: z.number().optional().describe("Return the top limit segmentation values. Only applies when 'on' is specified")
    },
    async ({ project_id = DEFAULT_PROJECT_ID, workspace_id, from_date, to_date, retention_type, born_event, event, born_where, return_where, interval, interval_count, unit, on, limit }) => {
      try {
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        const queryParams = new URLSearchParams({
          project_id: project_id || '',
          from_date: from_date,
          to_date: to_date
        });
        
        if (workspace_id) queryParams.append('workspace_id', workspace_id);
        if (retention_type) queryParams.append('retention_type', retention_type);
        if (born_event) queryParams.append('born_event', born_event);
        if (event) queryParams.append('event', event);
        if (born_where) queryParams.append('born_where', born_where);
        if (return_where) queryParams.append('where', return_where);
        if (interval) queryParams.append('interval', interval.toString());
        if (interval_count) queryParams.append('interval_count', interval_count.toString());
        if (unit) queryParams.append('unit', unit);
        if (on) queryParams.append('on', on);
        if (limit) queryParams.append('limit', limit.toString());
        
        const url = `${MIXPANEL_BASE_URL}/retention?${queryParams.toString()}`;
        
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
        console.error("Error fetching Mixpanel retention data:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Mixpanel retention data: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "custom_jql",
    "Run a custom JQL (JSON Query Language) script against your Mixpanel data. Useful for complex custom analyses, advanced data transformations, and queries that can't be handled by standard report types.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().optional().describe("The ID of the workspace if applicable"),
      script: z.string().describe("The JQL script to run (JavaScript code that uses Mixpanel's JQL functions)"),
      params: z.string().optional().describe("A JSON string containing parameters to pass to the script (will be available as the 'params' variable)")
    },
    async ({ project_id = DEFAULT_PROJECT_ID, workspace_id, script, params }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct URL with query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('project_id', project_id);
        if (workspace_id) queryParams.append('workspace_id', workspace_id);
        
        const url = `${MIXPANEL_BASE_URL}/jql?${queryParams.toString()}`;
        
        // Prepare form data for POST request
        const formData = new URLSearchParams();
        formData.append('script', script);
        if (params) formData.append('params', params);
        
        // Set up request options
        const options = {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'authorization': `Basic ${encodedCredentials}`,
            'content-type': 'application/x-www-form-urlencoded'
          },
          body: formData
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
        console.error("Error executing JQL query:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error executing JQL query: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "query_segmentation_sum",
    "Sum a numeric expression for events over time. Useful for calculating revenue metrics, aggregating quantitative values, and tracking cumulative totals across different time periods.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().optional().describe("The ID of the workspace if applicable"),
      event: z.string().describe("The event that you wish to get data for (single event name, not an array)"),
      from_date: z.string().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
      on: z.string().describe("The expression to sum per unit time (should result in a numeric value)"),
      unit: z.enum(["hour", "day"]).optional().describe("Time bucket size: 'hour' or 'day'. Default is 'day'"),
      where: z.string().optional().describe(`An expression to filter events by based on the grammar: <expression> ::= 'properties["' <property> '"]'
                  | <expression> <binary op> <expression>
                  | <unary op> <expression>
                  | <math op> '(' <expression> ')'
                  | <string literal>
    <binary op> ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' |
                    '>' | '>=' | '<' | '<=' | 'in' | 'and' | 'or'
                  | <unary op> ::= '-' | 'not'`),
    },
    async ({ project_id = DEFAULT_PROJECT_ID, workspace_id, event, from_date, to_date, on, unit, where }) => {
      try {
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        const queryParams = new URLSearchParams({
          project_id: project_id || '',
          event: event,
          from_date: from_date,
          to_date: to_date,
          on: on
        });
        
        if (workspace_id) queryParams.append('workspace_id', workspace_id);
        if (unit) queryParams.append('unit', unit);
        if (where) queryParams.append('where', where);
        
        const url = `${MIXPANEL_BASE_URL}/segmentation/sum?${queryParams.toString()}`;
        
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
        console.error("Error fetching Mixpanel segmentation sum data:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Mixpanel segmentation sum data: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "query_profiles",
    "Query Mixpanel user profiles with filtering options. Useful for retrieving detailed user profiles, filtering by specific properties, and analyzing user behavior across different dimensions.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.. Optional since it has a default.").optional(),
      workspace_id: z.string().describe("The ID of the workspace if applicable").optional(),
      distinct_id: z.string().describe("A unique identifier used to distinguish an individual profile").optional(),
      distinct_ids: z.string().describe("A JSON array of distinct_ids to retrieve profiles for. Example: '[\"id1\", \"id2\"]'").optional(),
      data_group_id: z.string().describe("The ID of the group key, used when querying group profiles").optional(),
      where: z.string().describe(`An expression to filter users (or groups) by. Using the following grammar: <expression> ::= 'properties["' <property> '"]'
                  | <expression> <binary op> <expression>
                  | <unary op> <expression>
                  | <math op> '(' <expression> ')'
                  | <typecast op> '(' <expression> ')'
                  | '(' <expression> ')'
                  | <boolean literal>
                  | <numeric literal>
                  | <string literal>
    <binary op> ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' |
                    '>' | '>=' | '<' | '<=' | 'in' | 'and' | 'or'
    <unary op> ::= '-' | 'not'
      <math op> ::= 'floor' | 'round' | 'ceil'
  <typecast op> ::= 'boolean' | 'number' | 'string'
    <property> ::= 'properties["' <property name> '"]'`).optional(),
      output_properties: z.string().describe("A JSON array of names of properties you want returned. Example: '[\"$last_name\", \"$email\", \"Total Spent\"]'").optional(),
      session_id: z.string().describe("A string id provided in the results of a previous query. Using a session_id speeds up api response, and allows paging through results").optional(),
      page: z.number().describe("Which page of the results to retrieve. Pages start at zero. If the 'page' parameter is provided, the session_id parameter must also be provided").optional(),
      behaviors: z.number().describe("If you are exporting user profiles using an event selector, you use a 'behaviors' parameter in your request").optional(),
      as_of_timestamp: z.number().describe("This parameter is only useful when also using 'behaviors'").optional(),
      filter_by_cohort: z.string().describe("Takes a JSON object with a single key called 'id' whose value is the cohort ID. Example: '{\"id\":12345}'").optional(),
      include_all_users: z.boolean().describe("Only applicable with 'filter_by_cohort' parameter. Default is true").optional(),
    },
    async ({ 
      project_id = DEFAULT_PROJECT_ID, 
      workspace_id, 
      distinct_id, 
      distinct_ids, 
      data_group_id, 
      where, 
      output_properties, 
      session_id, 
      page, 
      behaviors, 
      as_of_timestamp, 
      filter_by_cohort, 
      include_all_users 
    }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct base URL with project_id
        let url = `${MIXPANEL_BASE_URL}/engage?project_id=${project_id}`;
        
        // Add optional workspace_id if provided
        if (workspace_id) {
          url += `&workspace_id=${workspace_id}`;
        }
        
        // Create form data for POST request
        const formData = new URLSearchParams();
        
        // Add optional parameters to form data if they exist
        if (distinct_id) formData.append('distinct_id', distinct_id);
        if (distinct_ids) formData.append('distinct_ids', distinct_ids);
        if (data_group_id) formData.append('data_group_id', data_group_id);
        if (where) formData.append('where', where);
        if (output_properties) formData.append('output_properties', output_properties);
        if (session_id) formData.append('session_id', session_id);
        if (page !== undefined) formData.append('page', page.toString());
        if (behaviors !== undefined) formData.append('behaviors', behaviors.toString());
        if (as_of_timestamp !== undefined) formData.append('as_of_timestamp', as_of_timestamp.toString());
        if (filter_by_cohort) formData.append('filter_by_cohort', filter_by_cohort);
        if (include_all_users !== undefined) formData.append('include_all_users', include_all_users.toString());
        
        // Set up request options
        const options = {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'authorization': `Basic ${encodedCredentials}`,
            'content-type': 'application/x-www-form-urlencoded'
          },
          body: formData
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
        console.error('Error querying profiles:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error querying profiles: ${error}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "query_frequency_report",
    "Get data for frequency of actions over time. Useful for analyzing how often users perform specific actions, identifying patterns of behavior, and tracking user engagement over time.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().describe("The ID of the workspace if applicable").optional(),
      from_date: z.string().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
      unit: z.enum(["day", "week", "month"]).describe("The overall time period to return frequency of actions for"),
      addiction_unit: z.enum(["hour", "day"]).describe("The granularity to return frequency of actions at"),
      event: z.string().describe("The event to generate returning counts for").optional(),
      where: z.string().describe(`An expression to filter the returning events by based on the grammar: <expression> ::= 'properties["' <property> '"]'
                  | <expression> <binary op> <expression>
                  | <unary op> <expression>
                  | <math op> '(' <expression> ')'
                  | <string literal>
    <binary op> ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' |
                    '>' | '>=' | '<' | '<=' | 'in' | 'and' | 'or'
                  | <unary op> ::= '-' | 'not'`),
      on: z.string().describe("The property expression to segment the second event on").optional(),
      limit: z.number().describe("Return the top limit segmentation values. This parameter does nothing if 'on' is not specified").optional(),
    },
    async ({ 
      project_id = DEFAULT_PROJECT_ID, 
      workspace_id, 
      from_date, 
      to_date, 
      unit, 
      addiction_unit, 
      event, 
      where, 
      on, 
      limit 
    }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct base URL with required parameters
        let url = `${MIXPANEL_BASE_URL}/retention/addiction?project_id=${project_id}&from_date=${from_date}&to_date=${to_date}&unit=${unit}&addiction_unit=${addiction_unit}`;
        
        // Add optional parameters if they exist
        if (workspace_id) url += `&workspace_id=${workspace_id}`;
        if (event) url += `&event=${encodeURIComponent(event)}`;
        if (where) url += `&where=${encodeURIComponent(where)}`;
        if (on) url += `&on=${encodeURIComponent(on)}`;
        if (limit !== undefined) url += `&limit=${limit}`;
        
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
        console.error('Error querying frequency report:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error querying frequency report: ${error}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "query_segmentation_report",
    "Get data for an event, segmented and filtered by properties. Useful for breaking down event data by user attributes, comparing performance across segments, and identifying which user groups perform specific actions.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().describe("The ID of the workspace if applicable").optional(),
      event: z.string().describe("The event that you wish to get data for. Note: this is a single event name, not an array"),
      from_date: z.string().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
      on: z.string().describe("The property expression to segment the event on").optional(),
      unit: z.enum(["minute", "hour", "day", "month"]).describe("The buckets into which the property values that you segment on are placed. Default is 'day'").optional(),
      interval: z.number().describe("Optional parameter in lieu of 'unit' when 'type' is not 'general'. Determines the number of days your results are bucketed into").optional(),
      where: z.string().describe(`An expression to filter events by based on the grammar: <expression> ::= 'properties["' <property> '"]'
                  | <expression> <binary op> <expression>
                  | <unary op> <expression>
                  | <math op> '(' <expression> ')'
                  | <string literal>
    <binary op> ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' |
                    '>' | '>=' | '<' | '<=' | 'in' | 'and' | 'or'
                  | <unary op> ::= '-' | 'not'`),
      limit: z.number().describe("Return the top property values. Defaults to 60. Maximum value 10,000. This parameter does nothing if 'on' is not specified").optional(),
      type: z.enum(["general", "unique", "average"]).describe("The type of analysis to perform, either general, unique, or average, defaults to general").optional(),
      format: z.enum(["csv"]).describe("Can be set to 'csv'").optional(),
    },
    async ({ 
      project_id = DEFAULT_PROJECT_ID, 
      workspace_id, 
      event, 
      from_date, 
      to_date, 
      on, 
      unit, 
      interval, 
      where, 
      limit, 
      type, 
      format 
    }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct base URL with required parameters
        let url = `${MIXPANEL_BASE_URL}/segmentation?project_id=${project_id}&event=${encodeURIComponent(event)}&from_date=${from_date}&to_date=${to_date}`;
        
        // Add optional parameters if they exist
        if (workspace_id) url += `&workspace_id=${workspace_id}`;
        if (on) url += `&on=${encodeURIComponent(on)}`;
        if (unit) url += `&unit=${unit}`;
        if (interval !== undefined) url += `&interval=${interval}`;
        if (where) url += `&where=${encodeURIComponent(where)}`;
        if (limit !== undefined) url += `&limit=${limit}`;
        if (type) url += `&type=${type}`;
        if (format) url += `&format=${format}`;
        
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
        console.error('Error querying segmentation report:', error);
        throw error;
      }
    }
  );

  server.tool(
    "query_segmentation_bucket",
    "Get data for an event, segmented and filtered by properties, with values placed into numeric buckets. Useful for analyzing distributions of numeric values, creating histograms, and understanding the range of quantitative metrics.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().describe("The ID of the workspace if applicable").optional(),
      event: z.string().describe("The event that you wish to get data for. Note: this is a single event name, not an array"),
      from_date: z.string().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
      on: z.string().describe("The property expression to segment the event on. This expression must be a numeric property"),
      unit: z.enum(["hour", "day"]).describe("The buckets into which the property values that you segment on are placed. Default is 'day'").optional(),
      where: z.string().describe(`An expression to filter events by based on the grammar: <expression> ::= 'properties["' <property> '"]'
                  | <expression> <binary op> <expression>
                  | <unary op> <expression>
                  | <math op> '(' <expression> ')'
                  | <string literal>
    <binary op> ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' |
                    '>' | '>=' | '<' | '<=' | 'in' | 'and' | 'or'
                  | <unary op> ::= '-' | 'not'`),
      type: z.enum(["general", "unique", "average"]).describe("The type of analysis to perform, either general, unique, or average, defaults to general").optional(),
    },
    async ({ 
      project_id = DEFAULT_PROJECT_ID, 
      workspace_id, 
      event, 
      from_date, 
      to_date, 
      on, 
      unit, 
      where, 
      type 
    }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct base URL with required parameters
        let url = `${MIXPANEL_BASE_URL}/segmentation/numeric?project_id=${project_id}&event=${encodeURIComponent(event)}&from_date=${from_date}&to_date=${to_date}&on=${encodeURIComponent(on)}`;
        
        // Add optional parameters if they exist
        if (workspace_id) url += `&workspace_id=${workspace_id}`;
        if (unit) url += `&unit=${unit}`;
        if (where) url += `&where=${encodeURIComponent(where)}`;
        if (type) url += `&type=${type}`;
        
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
        console.error('Error querying segmentation bucket:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error querying segmentation bucket: ${error}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "query_segmentation_average",
    "Averages an expression for events per unit time. Useful for calculating average values like purchase amounts, session durations, or any numeric metric, and tracking how these averages change over time.",
    {
      project_id: z.string().describe("The Mixpanel project ID. Optional since it has a default.").optional(),
      workspace_id: z.string().describe("The ID of the workspace if applicable").optional(),
      event: z.string().describe("The event that you wish to get data for. Note: this is a single event name, not an array"),
      from_date: z.string().describe("The date in yyyy-mm-dd format to begin querying from (inclusive)"),
      to_date: z.string().describe("The date in yyyy-mm-dd format to query to (inclusive)"),
      on: z.string().describe("The expression to average per unit time. The result of the expression should be a numeric value"),
      unit: z.enum(["hour", "day"]).describe("The buckets [hour, day] into which the property values are placed. Default is 'day'").optional(),
      where: z.string().describe(`An expression to filter events by based on the grammar: <expression> ::= 'properties["' <property> '"]'
                  | <expression> <binary op> <expression>
                  | <unary op> <expression>
                  | <math op> '(' <expression> ')'
                  | <string literal>
    <binary op> ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' |
                    '>' | '>=' | '<' | '<=' | 'in' | 'and' | 'or'
                  | <unary op> ::= '-' | 'not'`).optional(),
    },
    async ({ 
      project_id = DEFAULT_PROJECT_ID, 
      workspace_id, 
      event, 
      from_date, 
      to_date, 
      on, 
      unit, 
      where 
    }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct base URL with required parameters
        let url = `${MIXPANEL_BASE_URL}/segmentation/average?project_id=${project_id}&event=${encodeURIComponent(event)}&from_date=${from_date}&to_date=${to_date}&on=${encodeURIComponent(on)}`;
        
        // Add optional parameters if they exist
        if (workspace_id) url += `&workspace_id=${workspace_id}`;
        if (unit) url += `&unit=${unit}`;
        if (where) url += `&where=${encodeURIComponent(where)}`;
        
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
          ],
          isError: true
        };
      } catch (error) {
        console.error('Error querying segmentation average:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error querying segmentation average: ${error}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "top_event_properties",
    "Get the top property names for an event. Useful for discovering which properties are most commonly associated with an event, prioritizing which dimensions to analyze, and understanding event structure.",
    {
      project_id: z.string().describe("The Mixpanel project ID").optional(),
      workspace_id: z.string().describe("The ID of the workspace if applicable").optional(),
      event: z.string().describe("The event that you wish to get data for. Note: this is a single event name, not an array"),
      limit: z.number().describe("The maximum number of properties to return. Defaults to 10").optional(),
    },
    async ({ 
      project_id = DEFAULT_PROJECT_ID, 
      workspace_id, 
      event, 
      limit 
    }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct base URL with required parameters
        let url = `${MIXPANEL_BASE_URL}/events/properties/top?project_id=${project_id}&event=${encodeURIComponent(event)}`;
        
        // Add optional parameters if they exist
        if (workspace_id) url += `&workspace_id=${workspace_id}`;
        if (limit !== undefined) url += `&limit=${limit}`;
        
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
        console.error('Error fetching top event properties:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching top event properties: ${error}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "top_event_property_values",
    "Get the top values for a property. Useful for understanding the distribution of values for a specific property, identifying the most common categories or segments, and planning further targeted analyses.",
    {
      project_id: z.string().describe("The Mixpanel project ID").optional(),
      workspace_id: z.string().describe("The ID of the workspace if applicable").optional(),
      event: z.string().describe("The event that you wish to get data for. Note: this is a single event name, not an array"),
      name: z.string().describe("The name of the property you would like to get data for"),
      limit: z.number().describe("The maximum number of values to return. Defaults to 255").optional(),
    },
    async ({ 
      project_id = DEFAULT_PROJECT_ID, 
      workspace_id, 
      event, 
      name,
      limit 
    }) => {
      try {
        // Create authorization header using base64 encoding of credentials
        const credentials = `${SERVICE_ACCOUNT_USER_NAME}:${SERVICE_ACCOUNT_PASSWORD}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        
        // Construct base URL with required parameters
        let url = `${MIXPANEL_BASE_URL}/events/properties/values?project_id=${project_id}&event=${encodeURIComponent(event)}&name=${encodeURIComponent(name)}`;
        
        // Add optional parameters if they exist
        if (workspace_id) url += `&workspace_id=${workspace_id}`;
        if (limit !== undefined) url += `&limit=${limit}`;
        
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
        console.error('Error fetching top event property values:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching top event property values: ${error}`
            }
          ],
          isError: true
        };
      }
    }
  );
  return server.server;
}