# GlucometerApp Agent Context

## Architecture
Ionic Angular application using Standalone Components.

## Patterns

### Services Pattern
Services are used to handle business logic and data persistence. 
- `GlucoseService`: Manages glucose records. 
- `AuthService`: Handles user authentication (Login/Register).
- `ApiService`: Generic wrapper for HttpClient.

### API Pattern
All external communication is handled via `HttpClient`.
Base URL is stored in `environment.ts`.
Endpoints:
- `POST /auth/login`: Login user.
- `POST /auth/register`: Register user.
- `GET /glicemias`: Get all records.
- `POST /glicemias`: Create record.
- `PUT /glicemias/:id`: Update record.
- `DELETE /glicemias/:id`: Delete record.
- `GET /reportes/glicemias/excel`: Get Excel report.

### Interceptor Pattern
`AuthInterceptor` attaches the JWT token to the `Authorization` header for every request if the token exists in storage.

### Login Flow
1. User enters credentials.
2. `AuthService.login()` calls backend.
3. On success, JWT token is stored in `@ionic/storage-angular`.
4. User is redirected to `home`.

### Token Storage
Token is stored using `@ionic/storage-angular` under the key `auth_token`.
