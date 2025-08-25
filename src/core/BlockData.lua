local BlockData = {}
BlockData.__index = BlockData

function BlockData:new()
    local o = {}
    setmetatable(o, self)
    self.__index = self
    
    o.blocks = {} -- [x][y][z] = blockType
    o.hasBlocks = false
    o.blockCount = 0
    o.bounds = {minX = 0, maxX = 0, minY = 0, maxY = 0, minZ = 0, maxZ = 0}
    
    -- Remove default test blocks - start with clean grid
    -- o:setBlock(0, 0, 0, "blockA")
    -- o:setBlock(1, 0, 0, "blockB") 
    -- o:setBlock(0, 1, 0, "blockC")
    -- o:setBlock(-1, 0, 0, "blockD")
    -- o:setBlock(0, -1, 0, "blockE")
    
    return o
end

function BlockData:setBlock(x, y, z, blockType)
    -- Validate coordinates
    if z < 0 or z > 49 then
        return false, "Z coordinate out of range (0-49)"
    end
    
    -- Check block limit
    if self.blockCount >= 500000 then
        return false, "Maximum block limit reached (500,000)"
    end
    
    -- Initialize coordinate arrays if needed
    if not self.blocks[x] then
        self.blocks[x] = {}
    end
    if not self.blocks[x][y] then
        self.blocks[x][y] = {}
    end
    
    -- Check if we're replacing an existing block
    local wasEmpty = (self.blocks[x][y][z] == nil)
    
    -- Set the block
    self.blocks[x][y][z] = blockType
    
    -- Update counts and flags
    if wasEmpty and blockType then
        self.blockCount = self.blockCount + 1
        self.hasBlocks = true
        -- Update bounds when adding a new block
        self:updateBounds(x, y, z)
    elseif not wasEmpty and not blockType then
        self.blockCount = self.blockCount - 1
        if self.blockCount == 0 then
            self.hasBlocks = false
        end
    end
    
    -- Clean block setting without debug output
    return true
end

function BlockData:removeBlock(x, y, z)
    -- Check if block exists
    if not self.blocks[x] or not self.blocks[x][y] or not self.blocks[x][y][z] then
        return false, "No block at specified coordinates"
    end
    
    -- Remove the block
    self.blocks[x][y][z] = nil
    self.blockCount = self.blockCount - 1
    
    -- Update flags
    if self.blockCount == 0 then
        self.hasBlocks = false
        -- Reset bounds when no blocks remain
        self.bounds = {minX = 0, maxX = 0, minY = 0, maxY = 0, minZ = 0, maxZ = 0}
    end
    
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
