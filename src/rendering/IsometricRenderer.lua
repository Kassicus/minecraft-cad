local BaseRenderer = require('src.rendering.BaseRenderer')
local HatchPatterns = require('src.rendering.HatchPatterns')

local IsometricRenderer = setmetatable({}, BaseRenderer)
IsometricRenderer.__index = IsometricRenderer

function IsometricRenderer:new(viewport)
    local o = BaseRenderer.new(viewport)
    
    -- Ensure viewport is preserved before changing metatable
    local savedViewport = o.viewport
    local savedCamera = o.camera
    
    setmetatable(o, self)
    self.__index = self
    
    -- Restore the fields that might have been lost
    o.viewport = savedViewport
    o.camera = savedCamera
    
    -- Isometric projection constants
    o.isoAngle = math.pi / 6 -- 30 degrees
    o.blockSize = 16 -- pixels per block
    o.blockHeight = 12 -- pixels per block height
    o.hatchPatterns = HatchPatterns:new()
    
    return o
end

function IsometricRenderer:render(blockData, appState)
    love.graphics.push()
    
    -- Account for left sidebar (280px width)
    local sidebarWidth = 280
    
    -- Draw main canvas background - match wireframe #0a1420
    love.graphics.setColor(0.039, 0.078, 0.125, 1.0)
    love.graphics.rectangle('fill', sidebarWidth, 0, self.viewport.width - sidebarWidth, self.viewport.height)
    
    love.graphics.translate(sidebarWidth + self.viewport.width / 2, self.viewport.height / 2)
    
    -- Apply camera transformations
    love.graphics.scale(self.camera.zoom)
    love.graphics.translate(-self.camera.x, -self.camera.y)
    
    -- Collect and sort all blocks for proper depth rendering
    local allBlocks = self:collectVisibleBlocks(blockData)
    table.sort(allBlocks, function(a, b)
        -- Sort back-to-front for proper layering (painter's algorithm)
        return (a.x + a.y + a.z) > (b.x + b.y + b.z)
    end)
    
    -- Draw grid
    self:drawGrid()
    
    -- Render each block as an isometric cube
    for _, block in ipairs(allBlocks) do
        self:drawIsometricBlock(block.x, block.y, block.z, block.type)
    end
    
    -- Draw preview block if we have mouse coordinates
    local mouseX, mouseY = love.mouse.getPosition()
    if mouseX and mouseY then
        local worldX, worldY = self:screenToWorld(mouseX, mouseY)
        local gridX = math.floor(worldX)
        local gridY = math.floor(worldY)
        local gridZ = appState.currentLevel
        self:drawPreviewBlock(gridX, gridY, gridZ, appState.selectedBlockType)
    end
    
    love.graphics.pop()
end

function IsometricRenderer:drawGrid()
    -- Grid lines - match wireframe blueprint blue #64b5f6 with proper visibility
    love.graphics.setColor(0.392, 0.71, 0.965, 0.3)
    love.graphics.setLineWidth(1)
    
    -- Draw isometric grid
    local gridSize = self.blockSize
    local extent = 8 -- Grid extent in blocks
    
    -- Draw isometric lines
    for i = -extent, extent do
        local x = i * gridSize
        -- Horizontal lines (parallel to X axis)
        local startX, startY = self:worldToIsometric(x, -extent * gridSize, 0)
        local endX, endY = self:worldToIsometric(x, extent * gridSize, 0)
        love.graphics.line(startX, startY, endX, endY)
        
        -- Vertical lines (parallel to Y axis)
        local startX2, startY2 = self:worldToIsometric(-extent * gridSize, x, 0)
        local endX2, endY2 = self:worldToIsometric(extent * gridSize, x, 0)
        love.graphics.line(startX2, startY2, endX2, endY2)
    end
    
    love.graphics.setLineWidth(1)
end

function IsometricRenderer:collectVisibleBlocks(blockData)
    local blocks = {}
    
    if not blockData.hasBlocks then
        return blocks
    end
    
    local bounds = blockData:getBounds()
    
    -- Only iterate within existing block bounds for efficiency
    if bounds.minX and bounds.maxX and bounds.minY and bounds.maxY then
        for x = bounds.minX, bounds.maxX do
            for y = bounds.minY, bounds.maxY do
                for z = 0, 49 do
                    local blockType = blockData:getBlock(x, y, z)
                    if blockType then
                        table.insert(blocks, {x = x, y = y, z = z, type = blockType})
                    end
                end
            end
        end
    end
    
    return blocks
end

function IsometricRenderer:worldToIsometric(x, y, z)
    -- Convert world coordinates to isometric screen coordinates
    local isoX = (x - y) * math.cos(self.isoAngle) * self.blockSize
    local isoY = (x + y) * math.sin(self.isoAngle) * self.blockSize - z * self.blockHeight
    return isoX, isoY
end

function IsometricRenderer:drawIsometricBlock(x, y, z, blockType)
    local isoX, isoY = self:worldToIsometric(x, y, z)
    
    -- Draw the three visible faces of the cube with proper shading
    self:drawCubeFace(isoX, isoY, blockType, 'top', 1.0)    -- Brightest
    self:drawCubeFace(isoX, isoY, blockType, 'left', 0.8)   -- Medium
    self:drawCubeFace(isoX, isoY, blockType, 'right', 0.6)  -- Darkest
end

function IsometricRenderer:drawCubeFace(x, y, blockType, face, brightness)
    local hatchPattern = self.hatchPatterns.blockTypes[blockType]
    if not hatchPattern then return end
    
    local r, g, b = unpack(hatchPattern.color)
    love.graphics.setColor(r * brightness, g * brightness, b * brightness, 1.0)
    
    -- Define face vertices based on face type
    local vertices = self:getFaceVertices(x, y, face)
    love.graphics.polygon('fill', vertices)
    
    -- Draw face outline
    love.graphics.setColor(0.4, 0.7, 0.96, 0.8) -- Blueprint blue outline
    love.graphics.setLineWidth(1)
    love.graphics.polygon('line', vertices)
end

function IsometricRenderer:getFaceVertices(x, y, face)
    local size = self.blockSize
    local height = self.blockHeight
    
    if face == 'top' then
        -- Top face (diamond shape)
        return {
            x, y,
            x + size, y - size/2,
            x, y - size,
            x - size, y - size/2
        }
    elseif face == 'left' then
        -- Left face (side of cube)
        return {
            x - size, y - size/2,
            x, y - size,
            x, y - size + height,
            x - size, y - size/2 + height
        }
    elseif face == 'right' then
        -- Right face (side of cube)
        return {
            x, y - size,
            x + size, y - size/2,
            x + size, y - size/2 + height,
            x, y - size + height
        }
    end
end

function IsometricRenderer:drawPreviewBlock(x, y, z, blockType)
    if not blockType then return end
    
    local isoX, isoY = self:worldToIsometric(x, y, z)
    
    -- Draw preview block with low opacity
    local hatchPattern = self.hatchPatterns.blockTypes[blockType]
    if hatchPattern then
        local r, g, b = unpack(hatchPattern.color)
        love.graphics.setColor(r, g, b, 0.5)
        
        -- Draw top face only for preview
        local vertices = self:getFaceVertices(isoX, isoY, 'top')
        love.graphics.polygon('fill', vertices)
        
        -- Draw preview border (solid line with different color)
        love.graphics.setColor(0.8, 0.8, 0.0, 0.8) -- Yellow preview border
        love.graphics.setLineWidth(3)
        love.graphics.polygon('line', vertices)
    end
end

function IsometricRenderer:screenToWorld(screenX, screenY)
    -- Account for left sidebar (280px width)
    local sidebarWidth = 280
    local adjustedX = screenX - sidebarWidth
    
    -- Convert screen coordinates to world coordinates
    local worldX = (adjustedX - self.viewport.width / 2) / self.camera.zoom + self.camera.x
    local worldY = (screenY - self.viewport.height / 2) / self.camera.zoom + self.camera.y
    
    -- Convert to grid coordinates
    local gridSize = self.blockSize
    local gridX = math.floor(worldX / gridSize + 0.5)
    local gridY = math.floor(worldY / gridSize + 0.5)
    
    return gridX, gridY
end

function IsometricRenderer:handleResize(width, height)
    self.viewport.width = width
    self.viewport.height = height
end

return IsometricRenderer
