import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/v1/identity/login', async () => {
    return HttpResponse.json({
      access: { token: 'mock-access-token', expires: new Date().toISOString() },
      refresh: { token: 'mock-refresh-token', expires: new Date().toISOString() }
    });
  }),
  http.post('/api/v1/identity/register', async ({ request }) => {
    const payload = await request.json();
    return HttpResponse.json(
      {
        id: 42,
        email: payload.email,
        name: payload.name,
        role: 0,
        passportNumber: payload.passportNumber,
        age: payload.age,
        passengerType: payload.passengerType,
        isEmailVerified: false,
        createdAt: new Date().toISOString()
      },
      { status: 201 }
    );
  }),
  http.get('/api/v1/user/me', async () => {
    return HttpResponse.json({
      id: 1,
      email: 'dev@dev.com',
      name: 'developer',
      role: 1,
      passportNumber: '12345678',
      age: 30,
      passengerType: 1,
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    });
  }),
  http.get('/api/v1/user/get-by-id', async ({ request }) => {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id') || 1);
    return HttpResponse.json({
      id,
      email: 'dev@dev.com',
      name: 'developer',
      role: 1,
      passportNumber: '12345678',
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    });
  })
];
