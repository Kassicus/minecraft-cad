local BlockData = {}
BlockData.__index = BlockData

function BlockData:new()
    local self = setmetatable({}, BlockData)
    self.blocks = {} -- Sparse 3D array: [x][y][z] = blockType
    self.blockCount = 0
    self.bounds = {minX = 0, maxX = 0, minY = 0, maxY = 0, minZ = 0, maxZ = 0}
    self.hasBlocks = false -- Flag to check if any blocks exist
    self.maxBlocks = 500000 -- Maximum total blocks allowed
    return self
end

function BlockData:setBlock(x, y, z, blockType)
    -- Coordinate validation (allow negative coordinates, limit Z to 0-49)
    if z < 0 or z >= 50 then
        return false, "Z coordinate out of bounds (0-49)"
    end
    
    -- Block count limit check
    if not self:getBlock(x, y, z) and blockType and self.blockCount >= self.maxBlocks then
        return false, "Would exceed " .. self.maxBlocks .. " block limit"
    end
    
    -- Initialize nested tables if needed
    if not self.blocks[x] then self.blocks[x] = {} end
    if not self.blocks[x][y] then self.blocks[x][y] = {} end
    
    -- Set block and update count
    local wasEmpty = (self.blocks[x][y][z] == nil)
    self.blocks[x][y][z] = blockType
    
    if wasEmpty and blockType then
        self.blockCount = self.blockCount + 1
        self.hasBlocks = true
    elseif not wasEmpty and not blockType then
        self.blockCount = self.blockCount - 1
        if self.blockCount == 0 then
            self.hasBlocks = false
        end
    end
    
    -- Update bounds
    self:updateBounds(x, y, z)
    
    print(string.format("BlockData: Block set at (%d,%d,%d) = %s, total count: %d", x, y, z, blockType, self.blockCount))
    return true
end

function BlockData:getBlock(x, y, z)
    local result = self.blocks[x] and self.blocks[x][y] and self.blocks[x][y][z]
    return result
end

function BlockData:getBlocksAtLevel(level)
    if not self.hasBlocks then 
        return {} 
    end
    
    local blocks = {}
    for x, xTable in pairs(self.blocks) do
        for y, yTable in pairs(xTable) do
            if yTable[level] then
                table.insert(blocks, {x = x, y = y, z = level, type = yTable[level]})
            end
        end
    end
    return blocks
end

function BlockData:getAllBlocks()
    if not self.hasBlocks then 
        return {} 
    end
    
    local blocks = {}
    for x, xTable in pairs(self.blocks) do
        for y, yTable in pairs(xTable) do
            for z, blockType in pairs(yTable) do
                table.insert(blocks, {x = x, y = y, z = z, type = blockType})
            end
        end
    end
    return blocks
end

function BlockData:getBlocksInRegion(minX, minY, maxX, maxY, level)
    if not self.hasBlocks then return {} end
    
    local blocks = {}
    for x = minX, maxX do
        if self.blocks[x] then
            for y = minY, maxY do
                if self.blocks[x][y] and self.blocks[x][y][level] then
                    table.insert(blocks, {x = x, y = y, z = level, type = self.blocks[x][y][level]})
                end
            end
        end
    end
    return blocks
end

function BlockData:updateBounds(x, y, z)
    if not self.hasBlocks then
        -- First block, initialize bounds
        self.bounds.minX, self.bounds.maxX = x, x
        self.bounds.minY, self.bounds.maxY = y, y
        self.bounds.minZ, self.bounds.maxZ = z, z
    else
        -- Update existing bounds
        self.bounds.minX = math.min(self.bounds.minX, x)
        self.bounds.maxX = math.max(self.bounds.maxX, x)
        self.bounds.minY = math.min(self.bounds.minY, y)
        self.bounds.maxY = math.max(self.bounds.maxY, y)
        self.bounds.minZ = math.min(self.bounds.minZ, z)
        self.bounds.maxZ = math.max(self.bounds.maxZ, z)
    end
end

function BlockData:getBounds()
    return self.bounds
end

function BlockData:getBlockCount()
    return self.blockCount
end

function BlockData:getGridExtent()
    if not self.hasBlocks then
        return 30 -- Default extent when no blocks exist
    end
    
    local bounds = self.bounds
    local maxExtent = math.max(
        math.abs(bounds.minX), math.abs(bounds.maxX),
        math.abs(bounds.minY), math.abs(bounds.maxY)
    )
    
    -- Add buffer zone and ensure minimum extent
    local result = math.max(maxExtent + 5, 30)
    return result
end

function BlockData:clear()
    self.blocks = {}
    self.blockCount = 0
    self.bounds = {minX = 0, maxX = 0, minY = 0, maxY = 0, minZ = 0, maxZ = 0}
    self.hasBlocks = false
end

return BlockData
