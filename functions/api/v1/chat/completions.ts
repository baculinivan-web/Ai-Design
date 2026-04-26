// Alias route for clients that still call `/api/v1/chat/completions`.
// Reuse the same handler as `/v1/chat/completions`.
export { onRequest } from '../../../v1/chat/completions';

