import { useState, useRef, useEffect, memo, useCallback } from "react";
import {
  saveChatHistory,
  clearChatHistory,
  loadChatDraft,
  saveChatDraft,
  clearChatDraft,
} from "@/utils/chatStorage";
import { apiConfig, authConfig, endpoints } from "@/config";
import { saveMessageToServer, fetchChatHistory } from "@/services/chatHistoryService";
import { getToken } from "@/utils/authStorage";
// Helper: check if an URL points to the same API origin (handles localhost vs 127.0.0.1)
function isSameApiOrigin(url: string): boolean {
  try {
    const target = new URL(url, window.location.origin);
    const apiBase = new URL(apiConfig.API_HTTP_BASE);
    return target.origin === apiBase.origin;
  } catch {
    return false;
  }
}

// Component fetch và hiển thị ảnh từ URL API bằng Authorization header
const ChatImageFromUrl = ({ url }: { url: string }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function fetchImg() {
      setError(false);
      setLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:ChatImageFromUrl',message:'Fetching image',data:{url,urlLength:url.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FETCH'})}).catch(()=>{});
      // #endregion
      try {
        const token =
          typeof window !== "undefined"
            ? getToken()
            : null;
        const isLocalApi = isSameApiOrigin(url);
        const headers: HeadersInit = {};
        // Don't add Authorization header for /frames_no_auth endpoints - they don't require authentication
        if (token && isLocalApi && !url.includes("/frames_no_auth/")) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:ChatImageFromUrl',message:'Before fetch',data:{url,hasToken:!!token,isLocalApi},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FETCH'})}).catch(()=>{});
        // #endregion
        // #region agent log
        const useCredentials = !url.includes("/frames_no_auth/");
        fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:ChatImageFromUrl',message:'About to fetch',data:{url,headers:Object.keys(headers),hasAuthHeader:!!headers['Authorization'],credentials:useCredentials?'include':'omit',isNoAuthEndpoint:url.includes("/frames_no_auth/")},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FETCH'})}).catch(()=>{});
        // #endregion
        const res = await fetch(url, { headers, credentials: useCredentials ? "include" : "omit" });
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:ChatImageFromUrl',message:'After fetch',data:{url,status:res.status,statusText:res.statusText,ok:res.ok,contentType:res.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FETCH'})}).catch(()=>{});
        // #endregion
        if (!res.ok) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:ChatImageFromUrl',message:'Fetch failed',data:{url,status:res.status,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FETCH'})}).catch(()=>{});
          // #endregion
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const blob = await res.blob();
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:ChatImageFromUrl',message:'Blob received',data:{url,blobSize:blob.size,blobType:blob.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FETCH'})}).catch(()=>{});
        // #endregion
        if (!cancelled) {
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:ChatImageFromUrl',message:'Image loaded',data:{url,blobUrl:objectUrl.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FETCH'})}).catch(()=>{});
          // #endregion
        }
      } catch (err) {
        // #region agent log
        const errorDetails = err instanceof Error ? {
          name: err.name,
          message: err.message,
          stack: err.stack?.substring(0, 200)
        } : { error: String(err) };
        fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:ChatImageFromUrl',message:'Fetch error',data:{url,error:errorDetails,urlDecoded:decodeURIComponent(url),isLocalhost:url.includes('localhost')||url.includes('127.0.0.1')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FETCH'})}).catch(()=>{});
        // #endregion
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }
    fetchImg();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line
  }, [url]);
  if (error)
    return <div className="text-xs text-red-500">Không thể tải ảnh</div>;
  if (loading || !blobUrl)
    return <div className="w-32 h-24 bg-gray-200 animate-pulse rounded" />;
  return (
    <img
      src={blobUrl}
      alt="Ảnh chat"
      className="w-full h-full rounded shadow border border-gray-200 dark:border-gray-700 object-contain"
      style={{ width: "100%", height: "100%" }}
    />
  );
};
import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { ScrollArea } from "@/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
// Custom markdown components for react-markdown v8+
const markdownComponents: Components = {
  a: (props) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#a78bfa", textDecoration: "underline" }}
    />
  ),
  code: (props: { inline?: boolean; children?: React.ReactNode }) => {
    const { inline, children, ...rest } = props;
    return inline ? (
      <code
        {...rest}
        style={{
          background: "rgba(168, 85, 247, 0.2)",
          borderRadius: 4,
          padding: "2px 4px",
          fontSize: 13,
          color: "#e9d5ff",
        }}
      >
        {children}
      </code>
    ) : (
      <pre
        style={{
          background: "rgba(30, 41, 59, 0.8)",
          color: "#f8fafc",
          borderRadius: 6,
          padding: 12,
          overflowX: "auto",
          border: "1px solid rgba(168, 85, 247, 0.3)",
        }}
      >
        <code>{children}</code>
      </pre>
    );
  },
  img: (props) => {
    const src = (props as { src?: string }).src;
    if (src && isSameApiOrigin(src)) {
      return <ChatImageFromUrl url={src} />;
    }
    return (
      <img
        {...props}
        style={{ maxWidth: "100%", borderRadius: 8, margin: "8px 0" }}
        alt="Markdown img"
      />
    );
  },
  ul: (props) => <ul {...props} style={{ paddingLeft: 20, margin: "8px 0", color: "#ffffff" }} />,
  ol: (props) => <ol {...props} style={{ paddingLeft: 20, margin: "8px 0", color: "#ffffff" }} />,
  li: (props) => <li {...props} style={{ marginBottom: 4, color: "#ffffff" }} />,
  blockquote: (props) => (
    <blockquote
      {...props}
      style={{
        borderLeft: "4px solid #a78bfa",
        background: "rgba(168, 85, 247, 0.1)",
        padding: "8px 16px",
        margin: "8px 0",
        borderRadius: 4,
        color: "#e9d5ff",
      }}
    />
  ),
  p: (props) => <p {...props} style={{ margin: "8px 0", color: "#ffffff" }} />,
};
import { useWebSocket } from "../../../../hooks/useWebSocket";

// Helper function để tạo unique message ID với random string
const generateMessageId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `msg_${timestamp}_${random}`;
};

interface VehicleData {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
}

interface TrafficData {
  [roadName: string]: VehicleData;
}

interface Message {
  id: string;
  text: string;
  user: boolean;
  time: string;
  typing?: boolean;
  image?: string[];
}

interface ChatInterfaceProps {
  trafficData: TrafficData;
}

// Memoized MessageBubble component để tránh re-render không cần thiết
const MessageBubble = memo(
  ({
    msg,
    copiedMessageId,
    onCopyMessage,
    onPreviewImage,
  }: {
    msg: Message;
    copiedMessageId: string | null;
    onCopyMessage: (text: string, id: string) => void;
    onPreviewImage: (url: string) => void;
  }) => {
    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        className={`flex ${msg.user ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`${
            msg.image && msg.image.length > 0
              ? "max-w-[90%] sm:max-w-[60%] md:max-w-[45%]"
              : "max-w-[60%] sm:max-w-[45%] md:max-w-[35%]"
          } flex flex-col gap-1 rounded-xl px-4 py-3 shadow-lg border text-base transition-all hover:shadow-xl backdrop-blur-sm ${
            msg.user
              ? "bg-gradient-to-br from-blue-600/80 to-blue-700/80 border-blue-400/50 text-white text-right ml-auto"
              : "bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-purple-500/30 text-white text-left mr-auto"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-6 h-6">
              {msg.user ? (
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              ) : (
                <AvatarFallback>
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs text-white/90">
              {msg.user ? "Bạn" : "AI"}
            </span>
            <span className="text-xs text-white/70 ml-2">{msg.time}</span>
            {msg.typing && (
              <Loader2 className="w-4 h-4 animate-spin text-purple-300 ml-2" />
            )}
          </div>
          {msg.image && msg.image.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-2">
              {msg.image.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full sm:max-w-[520px] h-auto hover:opacity-90 transition"
                  onClick={() => onPreviewImage(imgUrl)}
                  title="Xem ảnh lớn"
                >
                  <ChatImageFromUrl url={imgUrl} />
                </button>
              ))}
            </div>
          )}
          {msg.text && (
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {msg.text}
            </ReactMarkdown>
          )}
          <div className="flex gap-2 mt-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopyMessage(msg.text, msg.id)}
              title="Sao chép nội dung"
              className="p-1"
            >
              {copiedMessageId === msg.id ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            {msg.user && (
              <Badge variant="outline" className="text-xs">
                Bạn
              </Badge>
            )}
            {!msg.user && (
              <Badge variant="secondary" className="text-xs">
                AI
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
  // Custom comparison function để optimize re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.msg.id === nextProps.msg.id &&
      prevProps.msg.text === nextProps.msg.text &&
      prevProps.msg.typing === nextProps.msg.typing &&
      prevProps.copiedMessageId === nextProps.copiedMessageId &&
      JSON.stringify(prevProps.msg.image) ===
        JSON.stringify(nextProps.msg.image)
    );
  }
);
MessageBubble.displayName = "MessageBubble";

// extractImageLinks and removeImageLinksFromText are unused, removed for lint clean
function addTokenToImageUrl(url: string): string {
  if (!url) return url;

  // Fix double protocol issue (http://http://)
  url = url.replace(/^https?:\/\/https?:\/\//i, (match) => {
    // Keep only the first protocol
    return match.includes("https://https://") ? "https://" : "http://";
  });

  // Remove all existing token parameters first
  url = url.replace(/([?&])token=[^&]+/g, "");
  // Clean up trailing & or ?
  url = url.replace(/[?&]$/, "");

  // Don't add token to /frames_no_auth endpoints - they don't require authentication
  if (url.includes("/frames_no_auth/")) {
    return url;
  }

  // Only add token if it's a local API URL and not a no_auth endpoint
  if (url.includes("localhost:8000") || url.includes("127.0.0.1:8000")) {
    const token = getToken();
    if (token) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}token=${encodeURIComponent(token)}`;
    }
  }
  return url;
}

function processImageUrlsInText(text: string): string {
  if (!text) return text;

  // Match image URLs
  const imgRegex =
    /(https?:\/\/[\w\-./%?=&@]+\.(?:jpg|jpeg|png|webp|gif|bmp))(?!\S)/gi;

  return text.replace(imgRegex, (match) => {
    return addTokenToImageUrl(match);
  });
}

const ChatInterface = ({ trafficData }: ChatInterfaceProps) => {
  // Initialize with empty messages - will load from server on mount
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(() => loadChatDraft());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hàm scroll xuống cuối
  const scrollToBottom = useCallback(() => {
    // Sử dụng setTimeout để đảm bảo DOM đã update xong
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  }, []);

  // Track current token to reload messages when user switches accounts
  const [currentToken, setCurrentToken] = useState(() =>
    getToken()
  );

  // Function to load messages from server or localStorage
  const loadMessagesForUser = useCallback(async (token: string | null) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:395',message:'loadMessagesForUser called',data:{tokenPrefix:token?.substring(0,20)||'null',hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (token) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:400',message:'Fetching chat history from server',data:{tokenPrefix:token.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const serverMessages = await fetchChatHistory();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:403',message:'Received chat history from server',data:{messageCount:serverMessages?.length||0,firstMessageId:serverMessages?.[0]?.id,lastMessageId:serverMessages?.[serverMessages.length-1]?.id,firstMessageText:serverMessages?.[0]?.text?.substring(0,30)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (serverMessages && serverMessages.length > 0) {
          console.log("[ChatInterface] Loaded", serverMessages.length, "messages from server");
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:408',message:'Setting messages from server',data:{messageCount:serverMessages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setMessages(serverMessages);
          // Save to localStorage for offline access
          saveChatHistory(serverMessages);
        } else {
          // No server messages, clear local storage for this user and start fresh
          console.log("[ChatInterface] No server messages, starting fresh");
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:415',message:'No server messages, clearing and starting fresh',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          clearChatHistory();
          setMessages([]);
        }
      } catch (error) {
        console.error("[ChatInterface] Error loading from server, using localStorage:", error);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:420',message:'Error loading from server',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // On error, clear and start fresh (don't use old localStorage data)
        clearChatHistory();
        setMessages([]);
      }
    } else {
      // No token, clear messages
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:428',message:'No token, clearing messages',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setMessages([]);
      clearChatHistory();
    }
  }, []);

  // Load messages from server on initial mount
  useEffect(() => {
    const token = getToken();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:434',message:'Initial mount - loading messages',data:{tokenPrefix:token?.substring(0,20)||'null',hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (token) {
      loadMessagesForUser(token);
    } else {
      // No token, show welcome message
      setMessages([{
        id: "1",
        text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có thể hỏi tôi về tình trạng giao thông hiện tại, thống kê xe cộ, hoặc bất kỳ thông tin nào về các tuyến đường đang được giám sát. Tôi có thể giúp gì cho bạn?",
        user: false,
        time: new Date().toLocaleTimeString("vi-VN"),
      }]);
    }
  }, []); // Only run on mount

  // Reload messages when token changes (user logged in/out or switched accounts)
  useEffect(() => {
    const token = getToken();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:451',message:'Token check in useEffect',data:{tokenExists:!!token,tokenFull:token||'null',currentTokenFull:currentToken||'null',tokensMatch:token===currentToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (token !== currentToken) {
      console.log("[ChatInterface] Token changed, reloading messages");
      console.log("  Old token:", currentToken?.substring(0, 10));
      console.log("  New token:", token?.substring(0, 10));
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:428',message:'Token changed detected',data:{oldTokenPrefix:currentToken?.substring(0,20),newTokenPrefix:token?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Clear messages immediately when token changes to prevent showing old user's data
      setMessages([]);
      clearChatHistory();
      
      setCurrentToken(token);
      loadMessagesForUser(token);
      setInput(loadChatDraft());
    }
  }, [currentToken, loadMessagesForUser]);

  // Listen for token change events (from login/logout)
  useEffect(() => {
    const handleTokenChange = () => {
      const token = getToken();
      console.log("[ChatInterface] Token change event received");
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:handleTokenChange',message:'Token change event received',data:{tokenPrefix:token?.substring(0,20),currentTokenPrefix:currentToken?.substring(0,20),tokensMatch:token===currentToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (token !== currentToken) {
        // Clear messages immediately when token changes
        setMessages([]);
        clearChatHistory();
        setCurrentToken(token);
        loadMessagesForUser(token);
        setInput(loadChatDraft());
      }
    };

    window.addEventListener('tokenChanged', handleTokenChange);
    return () => window.removeEventListener('tokenChanged', handleTokenChange);
  }, [currentToken, loadMessagesForUser]);

  // Check token periodically in case user logs in/out in another tab or component
  useEffect(() => {
    const interval = setInterval(() => {
      const token = getToken();
      if (token !== currentToken) {
        console.log("[ChatInterface] Token changed (polling), reloading messages");
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:tokenPolling',message:'Token changed (polling)',data:{oldTokenPrefix:currentToken?.substring(0,20),newTokenPrefix:token?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Clear messages immediately when token changes
        setMessages([]);
        clearChatHistory();
        setCurrentToken(token);
        loadMessagesForUser(token);
        setInput(loadChatDraft());
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [currentToken, loadMessagesForUser]);


  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Persist draft input
  useEffect(() => {
    saveChatDraft(input);
  }, [input]);

  // Kiểm tra trafficData
  useEffect(() => {
    const hasData = trafficData && Object.keys(trafficData).length > 0;
    console.log("Traffic Data Status:", {
      hasData,
      roads: Object.keys(trafficData || {}),
      data: trafficData,
    });

    if (!hasData && messages.length === 1) {
      // Chỉ hiển thị thông báo nếu là tin nhắn chào đầu tiên
      setMessages([
        {
          id: "1",
          text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Hiện tại hệ thống đang khởi động và thu thập dữ liệu giao thông. Tôi sẽ thông báo ngay khi có thông tin từ các tuyến đường.",
          user: false,
          time: new Date().toLocaleTimeString("vi-VN"),
        },
      ]);
    }
  }, [trafficData, messages.length]);

  // Auto-scroll khi messages thay đổi (gửi tin mới hoặc nhận tin mới)
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll xuống cuối khi component mount (mở chat lần đầu)
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Chat WebSocket with authentication - setup trước để dùng trong handlers
  const token = getToken(); // Use getToken() to read from sessionStorage, not localStorage
  const chatWsUrl = endpoints.chatWs;
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:tokenCheck',message:'Token check on mount',data:{hasToken:!!token,tokenLength:token?.length||0,chatWsUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, []);
  // #endregion

  // Show message if no token
  useEffect(() => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để sử dụng chat AI");
    }
  }, [token]);

  const {
    data: chatData,
    send: chatSocketSend,
    isConnected: isWsConnected,
    error: wsError,
  } = useWebSocket(chatWsUrl, {
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    authToken: token,
  });
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:wsStatus',message:'Chat WebSocket status',data:{isWsConnected,wsError,hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, [isWsConnected, wsError, token]);
  // #endregion

  useEffect(() => {
    if (wsError) {
      console.error("WebSocket Error:", wsError);
      // Only show error toast if it's a final error, not retry messages
      if (
        wsError.includes("Không thể kết nối với server") ||
        wsError.includes("Lỗi kết nối WebSocket")
      ) {
        toast.error(wsError);
      }
    }
  }, [wsError]);

  // Monitor connection status
  useEffect(() => {
    console.log("WebSocket Connection Status:", isWsConnected);
    if (isWsConnected) {
      toast.success("Đã kết nối với AI thành công!");
    }
  }, [isWsConnected]);

  // Bỏ phần xử lý/biến đổi câu hỏi - gửi thẳng nội dung người dùng nhập

  // Memoize handlers để tránh re-create functions
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    console.log("Sending message:", { message: userMessage }); // Log tin nhắn gửi đi
    setInput("");
    // clear saved draft after sending
    clearChatDraft();
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: generateMessageId(),
      text: userMessage,
      user: true,
      time: new Date().toLocaleTimeString("vi-VN"),
    };
    setMessages((prev) => [...prev, userMsg]);
    
    // Save user message to server (MongoDB)
    const token = getToken();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:548',message:'Saving user message to server',data:{message:userMessage.substring(0,50),hasToken:!!token,tokenPrefix:token?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    saveMessageToServer(userMessage, true).then((success) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:551',message:'User message save result',data:{success,message:userMessage.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (!success) {
        console.error("Failed to save user message to server");
      }
    }).catch((error) => {
      console.error("Failed to save user message to server:", error);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:556',message:'User message save error',data:{error:String(error),message:userMessage.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    });

    // Scroll xuống sau khi thêm tin nhắn người dùng
    scrollToBottom();

    // Add typing indicator
    const typingMsg: Message = {
      id: "typing",
      text: "",
      user: false,
      time: "",
      typing: true,
    };
    setMessages((prev) => [...prev, typingMsg]);

    try {
      if (!isWsConnected) {
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== "typing"),
          {
            id: generateMessageId(),
            text: "Không thể kết nối tới AI. Vui lòng thử lại sau.",
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
        ]);
        toast.error("Không thể kết nối tới AI");
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      }

      // Gửi thẳng tin nhắn người dùng tới AI
      const ok = chatSocketSend({ message: userMessage });
      console.log("Message sent status:", ok);

      if (!ok) {
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== "typing"),
          {
            id: generateMessageId(),
            text: "Không thể gửi tin nhắn tới AI. Vui lòng thử lại.",
            user: false,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
        ]);
        toast.error("Không thể gửi tin nhắn tới AI");
        setIsLoading(false);
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error("Chat error:", error);

      // Remove typing indicator and add error message
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== "typing"),
        {
          id: generateMessageId(),
          text: "Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.",
          user: false,
          time: new Date().toLocaleTimeString("vi-VN"),
        },
      ]);

      toast.error("Không thể kết nối với AI");
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, isWsConnected, chatSocketSend]); // Dependencies for useCallback

  useEffect(() => {
    if (!chatData) return;
    try {
      // Log toàn bộ dữ liệu nhận được từ WebSocket
      console.log("WebSocket Raw Response:", chatData);
      const payload = chatData as
        | { message?: string; image?: string[] }
        | undefined;
      const responseText = payload?.message;
      const responseImage = payload?.image;

      // Log chi tiết từng phần của response
      console.log("Response Text:", responseText);
      console.log("Response Images:", responseImage);

      // Chỉ bỏ qua nếu cả text và image đều không có hoặc undefined
      // Chấp nhận empty string vì AI có thể gửi text rỗng kèm ảnh
      const hasText = responseText !== undefined && responseText !== null;
      const hasImages = responseImage && responseImage.length > 0;

      if (!hasText && !hasImages) {
        console.log("No text or images in response, skipping");
        setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      }

      // Process image URLs to add authentication token
      const imageUrls = (responseImage || []).map((url) =>
        addTokenToImageUrl(url)
      );

      // Process text to add authentication token to any image URLs in text
      const processedText = processImageUrlsInText(responseText ?? "");

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:processResponse',message:'Processing WebSocket response',data:{hasResponseImage:!!responseImage,responseImageLength:responseImage?.length||0,responseImage,imageUrlsLength:imageUrls.length,imageUrls,hasText:!!processedText,textLength:processedText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FRONTEND'})}).catch(()=>{});
      // #endregion

      console.log("Processed Response:", {
        text: processedText,
        images: imageUrls,
        hasText: !!processedText,
        hasImages: imageUrls.length > 0,
      });

      // Create AI message
      const aiMessage: Message = {
        id: generateMessageId(),
        text: processedText,
        user: false,
        time: new Date().toLocaleTimeString("vi-VN"),
        image: imageUrls.length > 0 ? imageUrls : undefined,
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/f3e82a8f-dd4a-491a-a1d2-3af9f252196f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:createMessage',message:'AI message created',data:{messageId:aiMessage.id,hasText:!!aiMessage.text,hasImage:!!aiMessage.image,imageCount:aiMessage.image?.length||0,imageUrls:aiMessage.image},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_IMAGE_FRONTEND'})}).catch(()=>{});
      // #endregion
      
      // Save AI response to server (MongoDB)
      const token = getToken();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:671',message:'Saving AI message to server',data:{message:processedText.substring(0,50),hasToken:!!token,tokenPrefix:token?.substring(0,20),hasImages:imageUrls.length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      saveMessageToServer(processedText, false, imageUrls.length > 0 ? imageUrls : undefined).then((success) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:674',message:'AI message save result',data:{success,message:processedText.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        if (!success) {
          console.error("Failed to save AI message to server");
        }
      }).catch((error) => {
        console.error("Failed to save AI message to server:", error);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatInterface.tsx:679',message:'AI message save error',data:{error:String(error),message:processedText.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      });
      
      setMessages((prev) => {
        // Remove typing indicator
        const filtered = prev.filter((msg) => msg.id !== "typing");
        // Add AI response
        return [
          ...filtered,
          aiMessage,
        ];
      });

      // Bỏ toast success notification
      // toast.success("Đã nhận được phản hồi từ AI");
    } catch (error) {
      console.error("Error processing WebSocket response:", error);
      toast.error("Lỗi khi xử lý phản hồi");
    }
    setIsLoading(false);
    inputRef.current?.focus();
  }, [chatData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Restore clearChat for delete button
  const clearChat = useCallback(() => {
    const welcomeMsg: Message = {
      id: "1",
      text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có thể hỏi tôi về tình trạng giao thông hiện tại, thống kê xe cộ, hoặc bất kỳ thông tin nào về các tuyến đường đang được giám sát. Tôi có thể giúp gì cho bạn?",
      user: false,
      time: new Date().toLocaleTimeString("vi-VN"),
    };
    setMessages([welcomeMsg]);
    // Clear chat history using helper function
    clearChatHistory();
    toast.success("Đã xóa lịch sử chat");
  }, []);

  const exportHistory = useCallback(() => {
    try {
      const dataStr = JSON.stringify(messages, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat-history-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất lịch sử chat");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Không thể xuất lịch sử chat");
    }
  }, [messages]);

  const copyMessage = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1500);
      toast.success("Đã sao chép nội dung");
    } catch {
      toast.error("Không thể sao chép nội dung");
    }
  }, []);

  const handlePreviewImage = useCallback((url: string) => {
    setPreviewImage(url);
  }, []);

  // --- COMPONENT RETURN ---
  return (
    <Card className="w-full h-full flex flex-col relative border-0 bg-gradient-to-br from-slate-800/90 via-purple-900/90 to-slate-800/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent)]"></div>
      {/* Floating action buttons */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={exportHistory}
          title="Xuất lịch sử chat"
          className="bg-slate-700/80 hover:bg-blue-600/80 border border-purple-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearChat}
          title="Xóa lịch sử chat"
          className="bg-slate-700/80 hover:bg-red-600/80 border border-purple-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" />
        </Button>
      </div>
      <CardContent className="relative flex-1 p-3 sm:p-6 overflow-hidden">
        <ScrollArea className="h-full w-full pr-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-3 sm:gap-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  copiedMessageId={copiedMessageId}
                  onCopyMessage={copyMessage}
                  onPreviewImage={handlePreviewImage}
                />
              ))}
            </AnimatePresence>
            {/* Invisible element để scroll xuống */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </CardContent>
      <form
        className="relative flex items-center gap-2 sm:gap-3 p-3 sm:p-4 pb-6 sm:pb-8 border-t border-purple-500/20 bg-gradient-to-r from-slate-800/50 via-purple-900/50 to-slate-800/50 backdrop-blur-sm"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi về giao thông..."
          className="flex-1 h-11 sm:h-12 bg-slate-700/50 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={isLoading || !input.trim()}
          title="Gửi"
          className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg hover:shadow-xl transition-all"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </form>
      {/* Simple image preview modal */}
      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </motion.div>
      )}
    </Card>
  );
};
export default ChatInterface;
