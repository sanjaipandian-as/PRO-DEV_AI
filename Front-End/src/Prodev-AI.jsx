import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // Syntax highlighting theme

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const geminifetch = async (prompt) => {
    try {
      const systemPrompt = `
You are "ProDev AI", an advanced coding assistant for professional developers.

## MISSION:
Always give the most **complete, runnable** code possible, even if the project is large.
If a request is too big for a single response, provide:
1. A **fully working starter template**.
2. The **full file structure** with key files completely coded.
3. **Step-by-step setup and run instructions**.
4. Suggestions for expanding to the full project.

Never say "I cannot provide" unless it's illegal or unsafe.
If the project is large, break it into parts but still deliver a **runnable starting point**.

## SCOPE:
- Full frontend & backend code (React, Node.js, Express, Python, Java, etc.).
- Database integration (MongoDB, PostgreSQL, MySQL).
- API connection logic.
- State management (Redux, Context API, etc.).
- Authentication (JWT, OAuth).
- Payment gateways (Stripe test mode).
- Mock data or mock servers when real backend is not given.

## RESPONSE REQUIREMENTS:
When user asks for code:
- **Full, runnable code** (no placeholders unless requested).
- **Folder structure** clearly shown.
- **All file contents** included in Markdown code blocks.
- **Install & run commands** given.
- **Meaningful comments** in code.
- **Error handling** included.

When user asks for explanation:
- Clear step-by-step breakdown.
- Highlight important functions and logic.

## STYLE:
- Use Markdown for code blocks: \`\`\`language
- Use headings: **Setup**, **Code**, **Explanation**, **Next Steps**
- Keep tone professional and mentor-like.
- Avoid unnecessary disclaimers — always focus on delivering the solution.
`;
 // Keeping your full system prompt
      const requestBody = {
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: prompt }] },
        ],
      };
      const resp = await axios.post(GEMINI_API_URL, requestBody);
      return resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    } catch (e) {
      console.error("Error fetching response:", e.message);
      return "Error connecting to the AI server. Please try again.";
    }
  };

  const sendMessage = async () => {
  if (!input.trim()) return;

  // Add user's message instantly
  setMessages((prev) => [...prev, { text: input, sender: "user" }]);
  setInput("");
  setLoading(true);

  // Fetch AI full response
  const botFullText = await geminifetch(input);
  setLoading(false);

  // Add an empty bot message for typewriter animation
  let botMsg = { text: "", sender: "bot" };
  setMessages((prev) => [...prev, botMsg]);

  let index = 0;
  const interval = setInterval(() => {
    index++;
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...botMsg,
        text: botFullText.slice(0, index), // Show text gradually
      };
      return updated;
    });

    if (index >= botFullText.length) {
      clearInterval(interval);
    }
  }, 20); // typing speed in ms per character
};

  const CopyButton = ({ code }) => (
    <button
      className="absolute top-2 right-2 text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600"
      onClick={() => navigator.clipboard.writeText(code)}
    >
      Copy
    </button>
  );

  return (
    <div className="w-full h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col">
      
      {/* HEADER */}
      <header className="p-4 border-b border-white/10 bg-black/30 backdrop-blur-lg text-white font-semibold text-xl shadow-lg">
        <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
          ProDev AI
        </span>{" "}
        - Full Stack Coding Assistant
      </header>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 text-xs font-bold text-white shadow-md">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] px-5 py-4 relative shadow-md transition-all duration-200 ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-2xl rounded-br-none"
                  : "bg-white/5 border border-white/10 text-gray-200 rounded-2xl rounded-bl-none"
              }`}
            >
              {msg.sender === "bot" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline ? (
                        <div className="relative">
                          <CopyButton code={String(children).trim()} />
                          <pre className={`${className} overflow-x-auto p-3 rounded-lg bg-black/60`} {...props}>
                            <code>{children}</code>
                          </pre>
                        </div>
                      ) : (
                        <code className="bg-black/40 px-1 py-0.5 rounded" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-t-4 border-purple-500 rounded-full animate-spin"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-black/20 backdrop-blur-lg border-t border-white/10">
        <div className="flex items-center bg-[#1f1b3a] border border-white/10 rounded-full overflow-hidden shadow-lg">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask ProDev AI about coding..."
            className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-medium transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
