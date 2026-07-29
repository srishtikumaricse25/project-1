import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Silent SOS API',
    version: '1.0.0',
    description: 'API documentation for Silent SOS backend services',
  },
  servers: [
    { url: '/api', description: 'API base path' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful, returns JWT' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['name', 'email', 'phone', 'password']
              }
            }
          }
        },
        responses: {
          201: { description: 'User created' },
          400: { description: 'User already exists or validation error' }
        }
      }
    },
    '/alerts': {
      post: {
        summary: 'Create a new SOS alert',
        tags: ['Alerts'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  location: { type: 'object' },
                  batteryLevel: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Alert created' },
          401: { description: 'Unauthenticated' }
        }
      }
    },
    '/alerts/history': {
      get: {
        summary: 'Get alert history for the authenticated user',
        tags: ['Alerts'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of past alerts' },
          401: { description: 'Unauthenticated' }
        }
      }
    },
    '/contacts': {
      get: {
        summary: 'Retrieve contacts for the authenticated user',
        tags: ['Contacts'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of contacts' },
          401: { description: 'Unauthenticated' }
        }
      }
    },
    '/login': {
      post: {
        summary: 'User login (alias)',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful, returns JWT' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/register': {
      post: {
        summary: 'Register new user (alias)',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['name', 'email', 'phone', 'password']
              }
            }
          }
        },
        responses: {
          201: { description: 'User created' },
          400: { description: 'User already exists or validation error' }
        }
      }
    },
    '/history': {
      get: {
        summary: 'Get alert history for the authenticated user (alias)',
        tags: ['Alerts'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of past alerts' },
          401: { description: 'Unauthenticated' }
        }
      }
    }
  }
};

export const swaggerSpec = swaggerJsdoc({ definition: swaggerDefinition, apis: [] });
