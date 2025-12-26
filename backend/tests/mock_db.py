"""
Mock database dependency cho local testing không cần PostgreSQL
"""
from typing import AsyncGenerator

class MockAsyncSession:
    """Mock AsyncSession để thay thế database session"""
    
    def __init__(self):
        self._data = {}
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, *args):
        pass
    
    def add(self, obj):
        """Mock add - không làm gì"""
        pass
    
    async def commit(self):
        """Mock commit - không làm gì"""
        pass
    
    async def rollback(self):
        """Mock rollback - không làm gì"""
        pass
    
    async def refresh(self, obj):
        """Mock refresh - không làm gì"""
        pass
    
    async def delete(self, obj):
        """Mock delete - không làm gì"""
        pass
    
    async def execute(self, query):
        """Mock execute - trả về empty result"""
        class MockResult:
            def scalar(self):
                return None
            def scalar_one_or_none(self):
                return None
            def scalars(self):
                class MockScalars:
                    def all(self):
                        return []
                return MockScalars()
            def first(self):
                return None
            def all(self):
                return []
        
        return MockResult()
    
    def query(self, model):
        """Mock query - trả về mock query object"""
        class MockQuery:
            def filter(self, *args):
                return self
            
            def first(self):
                return None
            
            def all(self):
                return []
            
            def count(self):
                return 0
        
        return MockQuery()

async def mock_get_db() -> AsyncGenerator:
    """Mock database dependency"""
    session = MockAsyncSession()
    try:
        yield session
    finally:
        pass

