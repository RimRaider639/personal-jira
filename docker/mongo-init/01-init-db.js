// MongoDB initialization script for Personal Kanban Board
// This script runs when the MongoDB container is first created

// Switch to the kanban database
db = db.getSiblingDB('kanban');

// Create application user with readWrite permissions
db.createUser({
  user: 'kanban_user',
  pwd: 'kanban_password',
  roles: [
    {
      role: 'readWrite',
      db: 'kanban'
    }
  ]
});

// Create collections with schema validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'passwordHash', 'displayName'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'User email address - required'
        },
        passwordHash: {
          bsonType: 'string',
          description: 'Hashed password - required'
        },
        displayName: {
          bsonType: 'string',
          description: 'User display name - required'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

db.createCollection('boards', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'name'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'Reference to user - required'
        },
        name: {
          bsonType: 'string',
          description: 'Board name - required'
        },
        description: {
          bsonType: ['string', 'null'],
          description: 'Board description'
        },
        sectionOrder: {
          bsonType: 'array',
          description: 'Ordered array of section IDs'
        }
      }
    }
  }
});

db.createCollection('sections', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['boardId', 'name', 'position'],
      properties: {
        boardId: {
          bsonType: 'objectId',
          description: 'Reference to board - required'
        },
        name: {
          bsonType: 'string',
          description: 'Section name - required'
        },
        position: {
          bsonType: 'int',
          description: 'Section position - required'
        }
      }
    }
  }
});

db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sectionId', 'boardId', 'title', 'position'],
      properties: {
        sectionId: {
          bsonType: 'objectId',
          description: 'Reference to section - required'
        },
        boardId: {
          bsonType: 'objectId',
          description: 'Reference to board - required'
        },
        title: {
          bsonType: 'string',
          description: 'Task title - required'
        },
        description: {
          bsonType: ['string', 'null'],
          description: 'Task description'
        },
        priority: {
          enum: ['low', 'medium', 'high', 'critical', null],
          description: 'Task priority level'
        },
        storyPoints: {
          bsonType: ['int', 'null'],
          description: 'Story points estimate'
        },
        endDate: {
          bsonType: ['date', 'null'],
          description: 'Task due date'
        },
        position: {
          bsonType: 'int',
          description: 'Task position within section - required'
        },
        epicIds: {
          bsonType: 'array',
          description: 'Array of epic IDs'
        },
        comments: {
          bsonType: 'array',
          description: 'Embedded comments'
        },
        attachments: {
          bsonType: 'array',
          description: 'Embedded attachments'
        }
      }
    }
  }
});

db.createCollection('epics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['boardId', 'name'],
      properties: {
        boardId: {
          bsonType: 'objectId',
          description: 'Reference to board - required'
        },
        name: {
          bsonType: 'string',
          description: 'Epic name - required'
        },
        description: {
          bsonType: ['string', 'null'],
          description: 'Epic description'
        },
        color: {
          bsonType: 'string',
          description: 'Epic color (hex format)'
        }
      }
    }
  }
});

// Create indexes for optimal query performance
db.users.createIndex({ email: 1 }, { unique: true });

db.boards.createIndex({ userId: 1 });

db.sections.createIndex({ boardId: 1 });

db.tasks.createIndex({ boardId: 1 });
db.tasks.createIndex({ sectionId: 1 });
db.tasks.createIndex({ epicIds: 1 });
db.tasks.createIndex({ endDate: 1 });
db.tasks.createIndex({ priority: 1 });
db.tasks.createIndex(
  { title: 'text', description: 'text' },
  { name: 'task_text_search' }
);

db.epics.createIndex({ boardId: 1 });

print('Database initialization completed successfully!');
print('Collections created: users, boards, sections, tasks, epics');
print('Indexes created for optimal query performance');
