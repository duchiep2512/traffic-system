import json
import logging
from typing import Annotated

from langchain_core.tools import tool

from app.api import v1
from app.core.config import settings_network, LOG_PATH

logger = logging.getLogger(__name__)
BASE_URL = f"{settings_network.BASE_URL_API}/api/v1"

@tool
def get_roads() -> str:
    """Lấy danh sách các tuyến đường hiện có từ hệ thống.
    Trả về chuỗi JSON chứa danh sách tên các tuyến đường.
    """
    analyzer = v1.state.analyzer
    if analyzer is None:
        return json.dumps({"error": "Analyzer chưa được khởi tạo"}, ensure_ascii=False)
    
    road_names = analyzer.names
    if not road_names:
        return json.dumps({"roads": [], "message": "Không có tuyến đường nào."}, ensure_ascii=False)
    
    return json.dumps({"roads": road_names}, ensure_ascii=False)
    
from urllib.parse import quote

@tool
def get_frame_road(road_name: Annotated[str, "Tên tuyến đường"]) -> str:
    """Lấy url bytecode cho frame (ảnh) hiện tại của tuyến đường theo tên (road_name).
    Trả về url của ảnh JPEG.
    """
    try:
        safe_name = quote(road_name, safe="")
        url = f"{BASE_URL}/frames_no_auth/{safe_name}"
        return url
    except Exception as e:
        return f"Lỗi không xác định: {str(e)}"

@tool
def get_info_road(road_name: Annotated[str, "Tên tuyến đường"]) -> str:
    """Lấy thông tin (info) hiện tại của tuyến đường theo tên (road_name).
    Trả về chuỗi JSON chứa số lượng xe, tốc độ, v.v.
    """
    import logging
    import os
    import time
    logger = logging.getLogger(__name__)
    
    # region agent log
    # LOG_PATH được import từ config.py để đảm bảo nhất quán
    try:
        payload = {
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H1",
            "location": "tool_func.get_info_road",
            "message": "tool_called",
            "data": {
                "road_name": road_name,
                "road_name_repr": repr(road_name),
                "road_name_len": len(road_name),
            },
            "timestamp": int(time.time() * 1000),
        }
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as _f:
            _f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception as e:
        # Log exception để debug
        logger.error(f"Error logging tool_called: {e}", exc_info=True)
    # endregion agent log
    
    analyzer = v1.state.analyzer
    
    # region agent log
    try:
        # So sánh tên đường
        name_matches = []
        if analyzer and analyzer.names:
            for name in analyzer.names:
                match_info = {
                    "name": name,
                    "exact_match": name == road_name,
                    "case_insensitive_match": name.lower() == road_name.lower(),
                    "name_repr": repr(name),
                    "name_len": len(name),
                }
                name_matches.append(match_info)
        
        payload = {
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H2",
            "location": "tool_func.get_info_road",
            "message": "analyzer_check",
            "data": {
                "analyzer_is_none": analyzer is None,
                "analyzer_names": analyzer.names if analyzer else None,
                "analyzer_type": str(type(analyzer)) if analyzer else None,
                "name_matches": name_matches,
                "road_name_in_names": road_name in (analyzer.names if analyzer else []),
            },
            "timestamp": int(time.time() * 1000),
        }
        with open(LOG_PATH, "a", encoding="utf-8") as _f:
            _f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception as e:
        # Log exception để debug
        logger.error(f"Error logging analyzer_check: {e}", exc_info=True)
    # endregion agent log
    
    if analyzer is None:
        # Log khi analyzer None
        try:
            payload = {
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H_ERROR",
                "location": "tool_func.get_info_road",
                "message": "analyzer_is_none",
                "data": {
                    "road_name": road_name,
                    "error": "Analyzer chưa được khởi tạo",
                },
                "timestamp": int(time.time() * 1000),
            }
            with open(LOG_PATH, "a", encoding="utf-8") as _f:
                _f.write(json.dumps(payload, ensure_ascii=False) + "\n")
        except:
            pass
        return json.dumps({"error": "Analyzer chưa được khởi tạo"}, ensure_ascii=False)
    
    try:
        data = analyzer.get_info_road(road_name)
        
        # region agent log
        try:
            payload = {
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H3",
                "location": "tool_func.get_info_road",
                "message": "analyzer_data",
                "data": {
                    "road_name": road_name,
                    "data": data,
                    "data_is_empty": not data or data == {},
                    "data_keys": list(data.keys()) if isinstance(data, dict) else None,
                },
                "timestamp": int(time.time() * 1000),
            }
            with open(LOG_PATH, "a", encoding="utf-8") as _f:
                _f.write(json.dumps(payload, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Error logging analyzer_data: {e}", exc_info=True)
        # endregion agent log
        
        if not data:
            return json.dumps({"error": f"Không có dữ liệu cho tuyến đường '{road_name}'"}, ensure_ascii=False)
        
        result = json.dumps(data, ensure_ascii=False)
        
        # region agent log
        try:
            payload = {
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H4",
                "location": "tool_func.get_info_road",
                "message": "tool_result",
                "data": {
                    "road_name": road_name,
                    "result_length": len(result),
                    "result_preview": result[:200] if len(result) > 200 else result,
                },
                "timestamp": int(time.time() * 1000),
            }
            with open(LOG_PATH, "a", encoding="utf-8") as _f:
                _f.write(json.dumps(payload, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Error logging tool_result: {e}", exc_info=True)
        # endregion agent log
        
        return result
    except Exception as e:
        # region agent log
        try:
            payload = {
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H5",
                "location": "tool_func.get_info_road",
                "message": "tool_error",
                "data": {
                    "road_name": road_name,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                "timestamp": int(time.time() * 1000),
            }
            with open(LOG_PATH, "a", encoding="utf-8") as _f:
                _f.write(json.dumps(payload, ensure_ascii=False) + "\n")
        except Exception as log_err:
            logger.error(f"Error logging tool_error: {log_err}", exc_info=True)
        # endregion agent log
        
        logger.error(f"Error in get_info_road: {e}", exc_info=True)
        return json.dumps({"error": f"Lỗi khi lấy dữ liệu: {str(e)}"}, ensure_ascii=False)
    