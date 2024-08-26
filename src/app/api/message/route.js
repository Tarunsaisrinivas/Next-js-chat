import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_APP_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
  useTLS: true,
});
export async function POST(req) {
    try {
      const { name, message } = await req.json();
  
      
      console.log(`User: ${name}, Encrypted Message: ${message}`);
  
      
      await pusher.trigger('chat-channel', 'new-message', {
        name,
        message,
      });
  
      return new Response('Message sent', { status: 200 });
    } catch (error) {
      console.error('Error in POST /api/message:', error);
      return new Response('Error sending message', { status: 500 });
    }
  }