import json
import logging
from typing import Annotated

from langchain_core.tools import tool

from app.api import v1
from app.core.config import settings_network

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
    logger = logging.getLogger(__name__)
    
    # Debug: Kiểm tra state.analyzer
    logger.debug(f"get_info_road called for: {road_name}")
    analyzer = v1.state.analyzer
    logger.debug(f"analyzer is None: {analyzer is None}")
    if analyzer is not None:
        logger.debug(f"analyzer.names: {analyzer.names}")
        logger.debug(f"analyzer type: {type(analyzer)}")
        logger.debug(f"analyzer id: {id(analyzer)}")
    
    if analyzer is None:
        return json.dumps({"error": "Analyzer chưa được khởi tạo"}, ensure_ascii=False)
    
    try:
        data = analyzer.get_info_road(road_name)
        logger.debug(f"get_info_road data: {data}")
        if not data:
            return json.dumps({"error": f"Không có dữ liệu cho tuyến đường '{road_name}'"}, ensure_ascii=False)
        
        return json.dumps(data, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error in get_info_road: {e}", exc_info=True)
        return json.dumps({"error": f"Lỗi khi lấy dữ liệu: {str(e)}"}, ensure_ascii=False)
    