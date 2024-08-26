import Pusher from 'pusher';

const pusher = new Pusher({
  appId: '1855356',
  key: '4f3589ae406bc56a0afa',
  secret: '0364bc1486c2c6396129',
  cluster: 'mt1',
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