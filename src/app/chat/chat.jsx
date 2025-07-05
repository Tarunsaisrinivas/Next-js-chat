"use client";
import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import CryptoJS from "crypto-js";
import { useSearchParams } from "next/navigation";
import { IoMdLogOut } from "react-icons/io";
import { FiPaperclip, FiDownload, FiX } from "react-icons/fi";
import Image from "next/image";

export default function Chat() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Anonymous";
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
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

        const messageContent = JSON.parse(decrypted);

        setMessages((prev) => [
          ...prev,
          {
            name: data.name,
            text: messageContent.text,
            file: messageContent.file,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error("Error decrypting message:", error);
      }
    });

    return () => {
      pusher.unsubscribe("chat-channel");
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, and PDF files are allowed");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    setLoading(true);
    try {
      let messageContent = {
        text: newMessage.trim(),
        file: null,
      };

      // Handle file upload if present
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "File upload failed");
        }

        const { url, fileId } = await uploadResponse.json();
        messageContent.file = {
          url,
          fileId,
          type: selectedFile.type.startsWith("image/") ? "image" : "file",
          name: selectedFile.name,
        };
      }

      // Only send if we have content
      if (messageContent.text || messageContent.file) {
        const encrypted = CryptoJS.AES.encrypt(
          JSON.stringify(messageContent),
          "secret-key"
        ).toString();
        console.log(`User: ${name}, Encrypted Message: ${encrypted}`);
        await fetch("/api/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, message: encrypted }),
        });
      }

      // Reset inputs
      setNewMessage("");
      setSelectedFile(null);
      setFilePreview(null);
    } catch (err) {
      console.error("Error in sendMessage:", err);
      alert(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col md:w-2/4 m-auto h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chat Room</h1>
          <button
            className="bg-red-600 p-2 rounded-xl hover:bg-red-700 transition"
            onClick={handleLogout}
            title="Logout"
          >
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
              <div className="flex justify-between items-baseline">
                <strong className="block mb-1">{msg.name}</strong>
                <span className="text-xs opacity-70 ml-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Text message */}
              {msg.text && (
                <p className="break-words whitespace-pre-wrap mb-2">
                  {msg.text}
                </p>
              )}

              {/* File preview */}
              {msg.file && (
                <div className="mt-2">
                  {msg.file.type === "image" ? (
                    <div className="relative group">
                      <div className="relative w-full h-64">
                        <Image
                          src={msg.file.url}
                          alt={msg.file.name}
                          fill
                          className="object-contain rounded-lg border border-gray-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/file-icon.png";
                          }}
                          unoptimized={true}
                        />
                      </div>
                      <a
                        href={msg.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        download
                      >
                        <FiDownload size={16} />
                      </a>
                    </div>
                  ) : (
                    <a
                      href={msg.file.url}
                      className="inline-flex items-center text-black  hover:text-gray-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <FiDownload className="mr-1" />
                      {msg.file.name}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 shadow-md">
        {filePreview && (
          <div className="mb-2 relative h-32">
            <Image
              src={filePreview}
              alt="Preview"
              fill
              className="object-contain rounded-lg border border-gray-300"
              unoptimized={true}
            />
            <button
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
            >
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center">
          <label className="cursor-pointer mr-2">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
              accept="image/jpeg,image/png,application/pdf"
            />
            <FiPaperclip
              className="h-6 w-6 text-blue-600 hover:text-blue-800 transition"
              title="Attach file"
            />
          </label>

          {selectedFile && !filePreview && (
            <div className="flex items-center text-sm text-gray-600 mr-2 max-w-xs">
              <span className="truncate">{selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="ml-1 text-red-500"
              >
                <FiX size={14} />
              </button>
            </div>
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
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center min-w-[80px]"
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block animate-spin">↻</span>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
