CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(0) WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'GMT+4'),
    updated_at TIMESTAMP(0) WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'GMT+4')
);

CREATE TABLE IF NOT EXISTS weather (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2) NOT NULL,
    humidity DECIMAL(5,2) NOT NULL,
    pressure DECIMAL(6,2) NOT NULL,
    created_at TIMESTAMP(0) WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'GMT+4')
);

CREATE INDEX idx_measurements_station_id ON weather(station_id);
CREATE INDEX idx_measurements_created_at ON weather(created_at);