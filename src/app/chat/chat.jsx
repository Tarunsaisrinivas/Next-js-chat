"use client";
import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import CryptoJS from "crypto-js";
import { useSearchParams } from "next/navigation";
import { IoMdLogOut } from "react-icons/io";

export default function Chat() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Anonymous";
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    });

    const channel = pusher.subscribe("chat-channel");
    channel.bind("new-message", (data) => {
      try {
        const decrypted = CryptoJS.AES.decrypt(
          data.message,
          "secret-key"
        ).toString(CryptoJS.enc.Utf8);
        setMessages((prev) => [
          ...prev,
          { name: data.name, message: decrypted },
        ]);
      } catch (error) {
        console.error("Error decrypting message:", error);
      }
    });

    return () => {
      pusher.unsubscribe("chat-channel");
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) {
      console.log("No message or file to send"); // Debug log
      return;
    }

    setLoading(true);
    try {
      let messageToSend = "";
      console.log("Starting send process"); // Debug log

      if (selectedFile) {
        console.log("Preparing file upload:", selectedFile.name); // Debug log
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        console.log("Upload response status:", uploadResponse.status); // Debug log

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error("Upload failed:", errorData); // Debug log
          throw new Error(errorData.error || "File upload failed");
        }

        const data = await uploadResponse.json();
        console.log("Upload successful:", data.url); // Debug log
        messageToSend = `File: ${data.url}`;
        setSelectedFile(null);
      } else {
        messageToSend = newMessage;
      }

      const encrypted = CryptoJS.AES.encrypt(
        messageToSend,
        "secret-key"
      ).toString();
      console.log("encryptedMessage", encrypted);
      console.log("Sending message to chat API"); // Debug log
      const messageResponse = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message: encrypted }),
      });

      if (!messageResponse.ok) {
        throw new Error("Failed to send message");
      }

      console.log("Message sent successfully"); // Debug log
      setNewMessage("");
    } catch (err) {
      console.error("Error in sendMessage:", err); // Debug log
      alert(
        err.message || "Failed to send message. Check console for details."
      );
    } finally {
      setLoading(false);
    }
  };
  

  const handleInputChange = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    alert("Logged out successfully");
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col md:w-2/4 m-auto h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chat Room</h1>
          <button className="bg-red-600 p-2 rounded-xl" onClick={handleLogout}>
            <IoMdLogOut />
          </button>
        </div>
        <p className="text-sm mt-1">
          Logged in as: <span className="font-semibold">{name}</span>
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.name === name ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs ${
                msg.name === name
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              <strong className="block mb-1">{msg.name}</strong>
              {msg.message.startsWith("File: ") ? (
                <div className="mt-2">
                  {isImageFile(msg.message) ? (
                    <img
                      src={msg.message.replace("File: ", "")}
                      alt="Uploaded content"
                      className="max-w-full h-auto rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/file-icon.png";
                      }}
                    />
                  ) : (
                    <a
                      href={msg.message.replace("File: ", "")}
                      className="inline-flex items-center text-black hover:text-gray-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      Download File
                    </a>
                  )}
                </div>
              ) : (
                <p className="break-words">{msg.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 shadow-md">
        <div className="flex items-center">
          <label className="cursor-pointer mr-2">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="hidden"
              id="fileInput"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600 hover:text-blue-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </label>
          {selectedFile && (
            <span className="text-sm text-gray-600 mr-2 truncate max-w-xs">
              {selectedFile.name}
            </span>
          )}
          <input
            type="text"
            className="flex-1 border border-gray-300 p-3 rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleInputChange}
          />
          <button
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Helper function to check if file is an image
  function isImageFile(message) {
    if (!message.startsWith("File: ")) return false;
    const url = message.replace("File: ", "");
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  }
}
