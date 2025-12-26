import asyncio
import json
import os
import time
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, Response
from app.api import v1
from app.services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
from app.utils.jwt_handler import get_current_user, get_current_user_ws
from app.utils.transport_utils import enrich_info_with_thresholds

LOG_PATH = r"d:\Smart-Traffic-Monitoring-System\seminar\.cursor\debug.log"
def _agent_log(payload: dict):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as _f:
            _f.write(json.dumps(payload) + "\n")
    except Exception:
        pass

router = APIRouter()

@router.on_event("startup")
def start_up():
    if v1.state.analyzer is None:
        v1.state.analyzer = AnalyzeOnRoadForMultiprocessing()
        v1.state.analyzer.run_multiprocessing()

@router.get(
    path='/roads_name',
    summary="Lấy danh sách tên đường",
    description="API trả về danh sách tên các tuyến đường đang được giám sát trong hệ thống. Endpoint này KHÔNG yêu cầu xác thực JWT."
)
async def get_road_names():
    """
    API trả về danh sách tên các tuyến đường (KHÔNG xác thực JWT).
    Endpoint này là public để frontend có thể load danh sách đường trước khi user login.
    """
    # region agent log
    _agent_log({
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "H2",
        "location": "api_vehicles_frames.py:get_road_names",
        "message": "enter get_road_names",
        "data": {
            "analyzer_is_none": v1.state.analyzer is None
        },
        "timestamp": int(time.time() * 1000)
    })
    # endregion agent log

    print(f"📡 GET /api/v1/roads_name called")
    print(f"   Analyzer state: {v1.state.analyzer is not None}")
    
    if v1.state.analyzer is None:
        # Trả về danh sách mặc định nếu analyzer chưa khởi tạo
        print("⚠️ Analyzer chưa khởi tạo, trả về danh sách mặc định")
        return JSONResponse(content={"road_names": ["Ngã Tư Sở"]})
    
    # Kiểm tra analyzer có thuộc tính names không
    if not hasattr(v1.state.analyzer, 'names'):
        print("⚠️ Analyzer không có thuộc tính 'names'")
        return JSONResponse(content={"road_names": ["Ngã Tư Sở"]})
    
    names = v1.state.analyzer.names if v1.state.analyzer.names else []
    
    print(f"   Analyzer.names: {names} (type: {type(names)}, length: {len(names) if names else 0})")
    # region agent log
    _agent_log({
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "H2",
        "location": "api_vehicles_frames.py:get_road_names",
        "message": "names collected",
        "data": {
            "names": names,
            "names_len": len(names) if names else 0
        },
        "timestamp": int(time.time() * 1000)
    })
    # endregion agent log
    
    if not names or len(names) == 0:
        # Nếu analyzer chưa có names, trả về mặc định
        print("⚠️ Analyzer chưa có road names, trả về danh sách mặc định")
        return JSONResponse(content={"road_names": ["Ngã Tư Sở"]})
    
    print(f"✅ Trả về {len(names)} road names: {names}")
    return JSONResponse(content={"road_names": names})

@router.websocket(
    "/ws/frames/{road_name}",
    name="WebSocket trả về frame hình ảnh tuyến đường, có xác thực qua header, cookie, query params",
    )
async def websocket_frames(
    websocket: WebSocket, 
    road_name: str,
    current_user = Depends(get_current_user_ws)
):
    """
    WebSocket endpoint để stream video frames của tuyến đường theo thời gian thực.
    
    Args:
        road_name: Tên tuyến đường cần xem
        current_user: User đã được xác thực (tự động inject bởi FastAPI)
        
    Authentication:
        Yêu cầu token qua query params (?token=...), cookie (access_token), hoặc header (Authorization: Bearer ...)
    """
    await websocket.accept()
    
    if v1.state.analyzer is None:
        # region agent log
        _agent_log({
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H3",
            "location": "api_vehicles_frames.py:websocket_frames",
            "message": "analyzer missing on ws frames",
            "data": {"road_name": road_name},
            "timestamp": int(time.time() * 1000)
        })
        # endregion agent log
        await websocket.send_json({"error": "Video analyzer chưa được khởi tạo"})
        await websocket.close()
        return
    
    try:
        send_count = 0
        last_send = time.perf_counter()
        while True:
            frame_bytes = await asyncio.to_thread(v1.state.analyzer.get_frame_road, road_name)
            await websocket.send_bytes(frame_bytes)
            now = time.perf_counter()
            interval_ms = (now - last_send) * 1000
            last_send = now

            # region agent log
            _agent_log({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H3",
                "location": "api_vehicles_frames.py:websocket_frames",
                "message": "ws_frame_sent",
                "data": {
                    "road_name": road_name,
                    "frame_bytes": len(frame_bytes) if frame_bytes else 0,
                    "interval_ms": round(interval_ms, 2),
                    "send_count": send_count,
                },
                "timestamp": int(time.time() * 1000)
            })
            # endregion agent log

            send_count += 1
            await asyncio.sleep(1/30)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket frames error: {e}")
        await websocket.close()
        
@router.websocket(
    "/ws/info/{road_name}",
    name="WebSocket trả về thông tin phương tiện tuyến đường có xác thực qua header, cookie, query params",
)
async def websocket_info(
    websocket: WebSocket, 
    road_name: str,
    current_user = Depends(get_current_user_ws)
):
    """
    WebSocket endpoint để nhận thông tin phương tiện của tuyến đường theo thời gian thực.
    
    Args:
        road_name: Tên tuyến đường cần xem thông tin
        current_user: User đã được xác thực (tự động inject bởi FastAPI)
        
    Authentication:
        Yêu cầu token qua query params (?token=...), cookie (access_token), hoặc header (Authorization: Bearer ...)
    
    Returns:
        JSON data chứa thông tin phương tiện, cập nhật mỗi 5 giây
    """
    await websocket.accept()
    
    if v1.state.analyzer is None:
        # region agent log
        _agent_log({
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H3",
            "location": "api_vehicles_frames.py:websocket_info",
            "message": "analyzer missing on ws info",
            "data": {"road_name": road_name},
            "timestamp": int(time.time() * 1000)
        })
        # endregion agent log
        await websocket.send_json({"error": "Video analyzer chưa được khởi tạo"})
        await websocket.close()
        return
    
    try:
        while True:
            data = await asyncio.to_thread(v1.state.analyzer.get_info_road, road_name)
            # Enrich with per-road thresholds classification when possible
            try:
                enriched = enrich_info_with_thresholds(data, road_name)
            except Exception:
                enriched = data

            await websocket.send_json(enriched)
            await asyncio.sleep(1/50)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket info error: {e}")
        await websocket.send_json({"detail": f"Internal error: {str(e)}"})
        await websocket.close()

@router.get(
    path='/info/{road_name}',
    summary="Lấy thông tin phương tiện trên đường",
    description="API trả về thông tin phương tiện của tuyến đường (số lượng xe, tốc độ trung bình, v.v.). Endpoint này KHÔNG yêu cầu xác thực JWT."
)
async def get_info_road(road_name: str):
    """
    API trả về thông tin phương tiện của tuyến đường road_name (KHÔNG xác thực JWT).
    """
    data = await asyncio.to_thread(v1.state.analyzer.get_info_road, road_name)
    if data is None:
        return JSONResponse(content={
            "Lỗi: Dữ liệu bị lỗi, kiểm tra road_services"
            }, status_code=500)
    # Enrich with per-road thresholds classification when possible
    try:
        enriched = enrich_info_with_thresholds(data, road_name)
    except Exception:
        enriched = data

    return JSONResponse(content=enriched)

@router.get(
    path='/frames/{road_name}',
    summary="Lấy frame hình ảnh của đường (có xác thực)",
    description="API trả về frame hình ảnh (JPEG) hiện tại của tuyến đường. Yêu cầu xác thực JWT qua Authorization header, cookie, hoặc query parameter (?token=...)."
)
async def get_frame_road(road_name: str, current_user=Depends(get_current_user)):
    """
    Lấy frame hình ảnh hiện tại của tuyến đường (yêu cầu xác thực).
    
    Args:
        road_name: Tên tuyến đường
        current_user: User đã được xác thực (tự động inject bởi FastAPI)
    
    Authentication:
        Token có thể được gửi qua: OAUTH2
    
    Returns:
        Response: Image JPEG của frame hiện tại
    """
    frame_bytes = await asyncio.to_thread(v1.state.analyzer.get_frame_road, road_name)
    if frame_bytes is None:
        return JSONResponse(
            content={"error": "Lỗi: Dữ liệu bị lỗi, kiểm tra core"},
            status_code=500
        )
    return Response(content=frame_bytes, media_type="image/jpeg")


@router.get(
    path='/frames_no_auth/{road_name}',
    summary="Lấy frame hình ảnh (không xác thực)",
    description="API trả về frame hình ảnh (JPEG) hiện tại của tuyến đường. Endpoint này KHÔNG yêu cầu xác thực JWT - dùng cho mục đích demo hoặc public."
)   
async def get_frame_road_no_auth(road_name: str):
    frame_bytes = await asyncio.to_thread(v1.state.analyzer.get_frame_road, road_name)
    if frame_bytes is None:
        return JSONResponse(
            content={"error": "Lỗi: Dữ liệu bị lỗi, kiểm tra core"},
            status_code=500
        )
    return Response(content=frame_bytes, media_type="image/jpeg")
