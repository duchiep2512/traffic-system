/**
 * Chat History Sync Service
 * Đồng bộ lịch sử chat giữa localStorage và server database
 */

import { authConfig, apiConfig } from "../config";
import { getToken } from "@/utils/authStorage";

export interface Message {
  id: string;
  text: string;
  user: boolean;
  time: string;
  typing?: boolean;
  image?: string[];
}

interface ServerMessage {
  id: string;
  text: string;
  user: boolean;
  time: string;
  image: string[] | null;
  created_at: string;
}

/**
 * Fetch chat history from server
 */
export const fetchChatHistory = async (
  limit: number = 100,
  offset: number = 0
): Promise<Message[]> => {
  try {
    const token = getToken();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:29',message:'fetchChatHistory called',data:{limit,offset,tokenPrefix:token?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!token) {
      console.warn("No token found, cannot fetch chat history");
      return [];
    }

    const response = await fetch(
      `${apiConfig.API_HTTP_BASE}/chat/messages?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:48',message:'fetchChatHistory response',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ServerMessage[] = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:53',message:'fetchChatHistory data received',data:{messageCount:data.length,firstMessageId:data[0]?.id,lastMessageId:data[data.length-1]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Convert to frontend format
    return data.map((msg) => ({
      id: msg.id,
      text: msg.text,
      user: msg.user,
      time: msg.time,
      image: msg.image || undefined,
    }));
  } catch (error) {
    console.error("Error fetching chat history from server:", error);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:64',message:'fetchChatHistory error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return [];
  }
};

/**
 * Save a single message to server
 */
export const saveMessageToServer = async (
  message: string,
  isUser: boolean,
  images?: string[]
): Promise<boolean> => {
  try {
    const token = getToken();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:72',message:'saveMessageToServer called',data:{message:message.substring(0,50),isUser,hasImages:!!images,tokenPrefix:token?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!token) {
      console.warn("No token found, cannot save message");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:79',message:'No token found',data:{message:message.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return false;
    }

    const response = await fetch(`${apiConfig.API_HTTP_BASE}/chat/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        is_user: isUser,
        images: images || null,
        extra_data: {
          timestamp: new Date().toISOString(),
        },
      }),
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:99',message:'saveMessageToServer response',data:{status:response.status,statusText:response.statusText,ok:response.ok,message:message.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const errorText = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:102',message:'saveMessageToServer error response',data:{status:response.status,statusText:response.statusText,errorText:errorText.substring(0,200),message:message.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error saving message to server:", error);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4061f441-6473-480e-8d88-5fde7bf69a76',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatHistoryService.ts:108',message:'saveMessageToServer exception',data:{error:String(error),message:message.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return false;
  }
};

/**
 * Clear all chat history on server
 */
export const clearServerChatHistory = async (): Promise<boolean> => {
  try {
    const token = getToken();
    if (!token) {
      return false;
    }

    const response = await fetch(`${apiConfig.API_HTTP_BASE}/chat/messages`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error clearing server chat history:", error);
    return false;
  }
};

/**
 * Get message count from server
 */
export const getServerMessageCount = async (): Promise<number> => {
  try {
    const token = getToken();
    if (!token) {
      return 0;
    }

    const response = await fetch(
      `${apiConfig.API_HTTP_BASE}/chat/messages/count`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error("Error getting message count:", error);
    return 0;
  }
};

/**
 * Sync localStorage to server (upload local history)
 */
export const syncLocalToServer = async (
  messages: Message[]
): Promise<number> => {
  let syncedCount = 0;

  for (const msg of messages) {
    // Skip welcome messages or typing indicators
    if (msg.id === "1" || msg.typing) continue;

    const success = await saveMessageToServer(msg.text, msg.user, msg.image);

    if (success) {
      syncedCount++;
    } else {
      console.warn(`Failed to sync message ${msg.id}`);
    }
  }

  return syncedCount;
};
