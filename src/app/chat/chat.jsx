"use client";
import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import CryptoJS from 'crypto-js';
import { useSearchParams } from 'next/navigation';
import { IoMdLogOut } from "react-icons/io";

export default function Chat() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name')|| 'Anonymous';
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
   
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    });

   
    const channel = pusher.subscribe('chat-channel');
    channel.bind('new-message', (data) => {
      try {
      
        const decryptedMessage = CryptoJS.AES.decrypt(data.message, 'secret-key').toString(CryptoJS.enc.Utf8);
        setMessages((prev) => [...prev, { name: data.name, message: decryptedMessage }]);
      } catch (error) {
        console.error('Error decrypting message:', error);
      }
    });

    return () => {
      pusher.unsubscribe('chat-channel');
    };
  }, []);

  const handleInputChange = (e) => {
    if(e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };
  const sendMessage = async () => {
    if (newMessage.trim()) {
      const encryptedMessage = CryptoJS.AES.encrypt(newMessage, 'secret-key').toString();
      setLoading(true);
      try {
        await fetch('/api/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            message: encryptedMessage,
          }),
        });

        setNewMessage('');
        console.log('encryptedMessage', encryptedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
      }
      finally{
        setLoading(false);
      }
    }
  };

  const handlelogout = () => {
    window.location.href = '/';
    alert('Logged out successfully');
  };

  return (
    <div className="flex flex-col md:w-2/4 m-auto h-screen bg-gray-100">
   
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <h1 className="text-2xl font-bold text-center">Chat Room</h1>
      <div className='flex justify-between'>
      <p className="text-center mt-1">Logged in as: <span className="font-semibold">{name}</span></p>
      <button className='flex justify-end ml-auto bg-red-600 p-2 rounded-xl' onClick={handlelogout}><IoMdLogOut /></button>
      </div>
    </header>

    
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => (
        <div key={index} className={`flex ${msg.name === name ? 'justify-end' : 'justify-start'}`}>
          <div className={`p-3 rounded-lg max-w-xs ${msg.name === name ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
            <strong className="block mb-1 ">{msg.name}</strong>
            <p className='break-words'>{msg.message}</p>
          </div>
        </div>
      ))}
    </div>

    
    <div className="bg-white p-4 shadow-md">
      <div className="flex">
        <input
          type="text"
          className="border border-gray-300 p-3 rounded-lg w-full mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleInputChange}
          
        />
        <button
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={sendMessage}
          disabled={loading}

        >
          {loading?'sending...':'Send'}
          
        </button>
      </div>
    </div>
  </div>
  );
}
