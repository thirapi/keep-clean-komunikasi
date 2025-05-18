import PusherClient from 'pusher-js';

export const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
  authEndpoint: '/api/pusher',
});