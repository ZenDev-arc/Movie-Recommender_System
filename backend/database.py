from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./movies.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, unique=True, index=True)
    title = Column(String, index=True)
    overview_text = Column(Text)
    genres = Column(Text)  # JSON string
    keywords = Column(Text) # JSON string
    cast = Column(Text)     # JSON string
    director = Column(Text) # JSON string
    vote_average = Column(Float)
    popularity = Column(Float)
    runtime = Column(Float)
    tagline = Column(Text)
    release_date = Column(String)
    vote_count = Column(Integer)
    region = Column(String)
    tags = Column(Text)  # For pre-computed tags used in similarity
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

class SyncHistory(Base):
    __tablename__ = "sync_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    movies_added = Column(Integer)
    status = Column(String)
    log = Column(Text)

def init_db():
    Base.metadata.create_all(bind=engine)
