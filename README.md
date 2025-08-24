# Breeze ChMS MCP Server

A Model Context Protocol (MCP) server that provides access to the Breeze Church Management System API. This server allows AI assistants to interact with Breeze ChMS data including people management, events, contributions, tags, forms, volunteers, and families.

## Features

### People Management
- List people with filtering options
- Get detailed person information
- Add new people
- Update person information
- Delete people
- Manage profile fields

### Events Management
- List events within date ranges
- Get event details and schedules
- Create new events
- Delete event instances
- Manage event calendars
- Handle event attendance and check-ins

### Tags & Organization
- List all tags and tag folders
- Create new tags and folders
- Assign/unassign tags to people
- Organize with tag hierarchies

### Forms
- List forms (active and archived)
- Get form field definitions
- Retrieve form entries
- Delete form entries

### Volunteers
- List volunteers for events
- Schedule/unschedule volunteers
- Manage volunteer roles

### Families
- Create new families
- Add/remove people from families
- Destroy existing families

### Contributions/Giving
- Add contribution records
- Support multiple payment methods
- Handle fund allocations
- Batch contributions

### Activity Logging
- View detailed activity logs
- Filter by action type, date, user
- Track system changes

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

Set the following environment variables:

- `BREEZE_SUBDOMAIN`: Your Breeze subdomain (e.g., "mychurch" for mychurch.breezechms.com)
- `BREEZE_API_KEY`: Your Breeze API key (available from Extensions > API page in Breeze)

### Getting Your API Key

1. Log in to your Breeze ChMS account
2. Go to **Extensions** > **API**
3. Copy your API key
4. Note your subdomain from your browser URL

## Usage

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

### MCP Client Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "breeze-chms": {
      "command": "node",
      "args": ["path/to/breeze-chms-mcp-server/dist/index.js"],
      "env": {
        "BREEZE_SUBDOMAIN": "your-church-subdomain",
        "BREEZE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Desktop Configuration

For Claude Desktop, add to your configuration file:

```json
{
  "mcpServers": {
    "breeze-chms": {
      "command": "npx",
      "args": ["breeze-chms-mcp-server"],
      "env": {
        "BREEZE_SUBDOMAIN": "your-church-subdomain", 
        "BREEZE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### People Management
- `list_people` - List people with optional filtering and pagination
- `get_person` - Get detailed information about a specific person
- `add_person` - Add a new person to the database
- `update_person` - Update existing person information
- `delete_person` - Delete a person from the database
- `list_profile_fields` - Get all profile field sections and definitions

### Tags Management
- `list_tags` - List all tags and tag folders
- `add_tag` - Create a new tag
- `add_tag_folder` - Create a new tag folder
- `assign_tag` - Assign a tag to a person
- `unassign_tag` - Remove a tag from a person

### Events Management
- `list_events` - List events within a date range
- `get_event` - Get details about a specific event instance
- `add_event` - Create a new event
- `delete_event_instance` - Delete a specific event instance
- `list_calendars` - List all event calendars

### Event Attendance
- `checkin_person` - Check a person into or out of an event
- `get_event_attendance` - Get attendance records for an event

### Forms
- `list_forms` - List all forms (active or archived)
- `list_form_fields` - List fields for a specific form
- `list_form_entries` - List entries for a specific form

### Volunteers
- `list_volunteers` - List volunteers for an event instance
- `schedule_volunteer` - Schedule a volunteer for an event
- `unschedule_volunteer` - Remove a volunteer from an event

### Families
- `create_family` - Create a new family with specified people
- `destroy_family` - Destroy an existing family
- `add_to_family` - Add people to an existing family
- `remove_from_family` - Remove people from their current families

### Giving/Contributions
- `add_contribution` - Add a contribution/donation record

### Activity Logging
- `list_activity` - List activity log entries with filtering options

## Example Usage

### List People
```javascript
// List first 50 people with basic info
{
  "tool": "list_people",
  "arguments": {
    "details": 0,
    "limit": 50
  }
}

// List people with full details and filtering
{
  "tool": "list_people", 
  "arguments": {
    "details": 1,
    "filter_json": "{\"tag_contains\": \"volunteer\"}"
  }
}
```

### Add a New Person
```javascript
{
  "tool": "add_person",
  "arguments": {
    "first": "John",
    "last": "Doe",
    "fields_json": "[{\"field_id\":\"email_primary\",\"field_type\":\"email\",\"response\":true,\"details\":{\"address\":\"john.doe@example.com\"}}]"
  }
}
```

### Check Someone Into an Event
```javascript
{
  "tool": "checkin_person",
  "arguments": {
    "person_id": "12345678",
    "instance_id": "98765432",
    "direction": "in"
  }
}
```

### Add a Contribution
```javascript
{
  "tool": "add_contribution",
  "arguments": {
    "date": "2024-01-15",
    "person_json": "{\"name\":\"Jane Smith\",\"email\":\"jane@example.com\"}",
    "method": "Check",
    "amount": 100.00,
    "funds_json": "[{\"name\":\"General Fund\",\"amount\":75},{\"name\":\"Missions Fund\",\"amount\":25}]"
  }
}
```

### Assign Tags
```javascript
{
  "tool": "assign_tag",
  "arguments": {
    "person_id": "12345678",
    "tag_id": "567890"
  }
}
```

## API Rate Limits

The Breeze API has a rate limit of **20 requests per minute**. The server will handle this automatically, but for optimal performance, consider:

- Spacing out API calls (wait ~3.5 seconds between requests)
- Using bulk operations where possible
- Implementing caching for frequently accessed data

## Error Handling

The server provides detailed error messages for common issues:

- Invalid API credentials
- Missing required parameters
- API rate limit exceeded
- Invalid person/event/tag IDs
- Network connectivity issues

## Field Types and Structure

When updating people or working with custom fields, you'll need to understand Breeze's field structure:

### Common Field Types
- `text` - Simple text input
- `textarea` - Multi-line text
- `radio` - Multiple choice/dropdown (uses option IDs)
- `checkbox` - Multiple selections
- `date` - Date fields
- `email` - Email addresses
- `phone` - Phone numbers
- `address` - Street addresses
- `birthdate` - Birth dates
- `family_role` - Family relationship roles

### Field JSON Structure
```javascript
// Text field
{
  "field_id": "123456789",
  "field_type": "text", 
  "response": "Sample text value"
}

// Email field
{
  "field_id": "987654321",
  "field_type": "email",
  "response": true,
  "details": {
    "address": "user@example.com"
  }
}

// Phone field
{
  "field_id": "456789123",
  "field_type": "phone",
  "response": true,
  "details": {
    "phone_mobile": "555-123-4567"
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your API key is correct
   - Check that your subdomain matches your Breeze URL
   - Ensure you have API access enabled in Breeze

2. **Rate Limit Errors**
   - Reduce request frequency
   - Implement delays between calls
   - Use batch operations when available

3. **Invalid Field IDs**
   - Use `list_profile_fields` to get current field IDs
   - Field IDs can change if fields are recreated

4. **Permission Errors**
   - Verify your Breeze user has appropriate permissions
   - Some operations require admin-level access

### Debugging

Enable debug logging by setting the environment variable:
```bash
DEBUG=breeze-chms-mcp-server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

This is an unofficial integration. For Breeze ChMS support, visit [support.breezechms.com](https://support.breezechms.com).

For issues with this MCP server, please open a GitHub issue.

## Changelog

### v1.0.0
- Initial release
- Complete API coverage for people, events, tags, forms, volunteers, families
- Support for contributions and activity logging
- Comprehensive error handling and validation