local BaseRenderer = require('src.rendering.BaseRenderer')
local HatchPatterns = require('src.rendering.HatchPatterns')

local IsometricRenderer = setmetatable({}, BaseRenderer)
IsometricRenderer.__index = IsometricRenderer

function IsometricRenderer:new(viewport)
    local o = {}
    setmetatable(o, self)
    self.__index = self
    
    o.viewport = viewport
    o.camera = {
        x = 0,
        y = 0,
        scale = 1
    }
    
    return o
end

function IsometricRenderer:render(blockData)
    love.graphics.push()
    
    -- Apply camera transformations
    love.graphics.translate(self.camera.x, self.camera.y)
    love.graphics.scale(self.camera.scale)
    
    -- Draw grid
    self:drawGrid()
    
    -- Draw blocks
    self:drawBlocks(blockData)
    
    love.graphics.pop()
end

function IsometricRenderer:collectVisibleBlocks(blockData)
    local blocks = {}
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
    local isoX = (x - y) * 20
    local isoY = (x + y) * 10 - z * 20
    return isoX, isoY
end

function IsometricRenderer:drawIsometricBlock(x, y, z, blockType)
    local isoX, isoY = self:worldToIsometric(x, y, z)
    
    -- Draw cube faces
    self:drawCubeFace(isoX, isoY, 20, 20, blockType)
end

function IsometricRenderer:drawCubeFace(x, y, width, height, blockType)
    local vertices = self:getFaceVertices(x, y, width, height)
    
    -- Draw face with hatch pattern
    love.graphics.setColor(0.8, 0.8, 0.8, 0.9)
    love.graphics.polygon("fill", vertices)
    
    -- Draw border
    love.graphics.setColor(0.5, 0.5, 0.5, 1)
    love.graphics.polygon("line", vertices)
end

function IsometricRenderer:getFaceVertices(x, y, width, height)
    return {
        x, y,
        x + width, y,
        x + width, y + height,
        x, y + height
    }
end

function IsometricRenderer:screenToWorld(screenX, screenY)
    -- Convert screen coordinates to world coordinates
    local worldX = (screenX - self.camera.x) / self.camera.scale
    local worldY = (screenY - self.camera.y) / self.camera.scale
    
    -- Convert to grid coordinates (can be negative)
    local gridSize = 20
    local gridX = math.floor(worldX / gridSize + 0.5)
    local gridY = math.floor(worldY / gridSize + 0.5)
    
    return gridX, gridY
end

function IsometricRenderer:handleResize(width, height)
    self.viewport.width = width
    self.viewport.height = height
end

return IsometricRenderer
