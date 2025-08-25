local BaseRenderer = require('src.rendering.BaseRenderer')
local HatchPatterns = require('src.rendering.HatchPatterns')

local ElevationRenderer = setmetatable({}, BaseRenderer)
ElevationRenderer.__index = ElevationRenderer

function ElevationRenderer:new(viewport, direction)
    local o = BaseRenderer.new(viewport)
    
    -- Ensure viewport is preserved before changing metatable
    local savedViewport = o.viewport
    local savedCamera = o.camera
    
    setmetatable(o, self)
    self.__index = self
    
    -- Restore the fields that might have been lost
    o.viewport = savedViewport
    o.camera = savedCamera
    
    -- Elevation-specific properties
    o.direction = direction -- 'north', 'south', 'east', 'west'
    o.blockSize = 20 -- pixels per block
    o.hatchPatterns = HatchPatterns:new()
    
    return o
end

function ElevationRenderer:render(blockData, appState)
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
    
    -- Draw grid
    self:drawGrid()
    
    -- Calculate and draw visible external faces
    local visibleFaces = self:calculateVisibleFaces(blockData)
    
    -- Sort faces by depth for proper layering
    table.sort(visibleFaces, function(a, b)
        if self.direction == 'north' or self.direction == 'south' then
            return a.x < b.x -- Sort by X for N/S views
        else
            return a.y < b.y -- Sort by Y for E/W views
        end
    end)
    
    -- Draw each visible face
    for _, face in ipairs(visibleFaces) do
        self:drawElevationBlock(face)
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
    
    -- Draw elevation view title (overlay, not affected by camera)
    self:drawElevationTitle()
end

function ElevationRenderer:drawElevationTitle()
    -- Draw title overlay showing the elevation direction
    love.graphics.setColor(0.91, 0.957, 0.973, 1.0) -- Light blue-white text
    
    local title = string.upper(self.direction) .. " ELEVATION"
    local titleX = 300 -- Position after sidebar
    local titleY = 20
    
    love.graphics.print(title, titleX, titleY)
    
    -- Draw coordinate system info
    local coordInfo
    if self.direction == 'north' or self.direction == 'south' then
        coordInfo = "X-axis: Horizontal, Z-axis: Vertical (Height)"
    else
        coordInfo = "Y-axis: Horizontal, Z-axis: Vertical (Height)"
    end
    
    love.graphics.print(coordInfo, titleX, titleY + 25)
end

function ElevationRenderer:drawGrid()
    -- Grid lines - match wireframe blueprint blue #64b5f6 with proper visibility
    love.graphics.setColor(0.392, 0.71, 0.965, 0.3)
    love.graphics.setLineWidth(1)
    
    local gridSize = self.blockSize
    local maxHeight = 50 -- Maximum height in blocks
    
    -- Draw horizontal lines (height levels) from ground (0) to max height (50)
    for i = 0, maxHeight do
        local y = (maxHeight - i) * gridSize -- Invert so ground is at bottom
        love.graphics.line(-20 * gridSize, y, 20 * gridSize, y)
    end
    
    -- Draw vertical lines based on elevation direction
    if self.direction == 'north' or self.direction == 'south' then
        -- North/South views: X-axis horizontal
        for i = -20, 20 do
            local x = i * gridSize
            love.graphics.line(x, 0, x, maxHeight * gridSize)
        end
    else
        -- East/West views: Y-axis horizontal
        for i = -20, 20 do
            local x = i * gridSize
            love.graphics.line(x, 0, x, maxHeight * gridSize)
        end
    end
    
    love.graphics.setLineWidth(1)
end

function ElevationRenderer:calculateVisibleFaces(blockData)
    local faces = {}
    
    if not blockData.hasBlocks then
        return faces
    end
    
    local bounds = blockData:getBounds()
    
    -- If no bounds, return empty faces
    if not bounds.minX or not bounds.maxX or not bounds.minY or not bounds.maxY then
        return faces
    end
    
    -- Iterate through all blocks to find external faces
    for x = bounds.minX, bounds.maxX do
        for y = bounds.minY, bounds.maxY do
            for z = 0, 49 do
                local blockType = blockData:getBlock(x, y, z)
                if blockType then
                    -- Check if this block face is visible from the elevation direction
                    if self:isExternalFace(blockData, x, y, z) then
                        local screenX, screenY = self:worldToScreen(x, y, z)
                        table.insert(faces, {
                            x = x, y = y, z = z, type = blockType,
                            screenX = screenX, screenY = screenY
                        })
                    end
                end
            end
        end
    end
    
    return faces
end

function ElevationRenderer:isExternalFace(blockData, x, y, z)
    -- Check if this block face is visible from the elevation direction
    local checkX, checkY = x, y
    
    if self.direction == 'north' then
        checkY = y - 1 -- Check block to the north
    elseif self.direction == 'south' then
        checkY = y + 1 -- Check block to the south
    elseif self.direction == 'east' then
        checkX = x + 1 -- Check block to the east
    elseif self.direction == 'west' then
        checkX = x - 1 -- Check block to the west
    end
    
    -- Face is external if there's no block in front of it
    local hasBlockInFront = blockData:getBlock(checkX, checkY, z)
    
    -- Return true if there's no block in front (external face)
    return not hasBlockInFront
end

function ElevationRenderer:worldToScreen(x, y, z)
    -- Convert world coordinates to screen coordinates for elevation view
    local screenX, screenY
    
    if self.direction == 'north' or self.direction == 'south' then
        -- North/South views: X-axis horizontal, Z-axis vertical
        screenX = x * self.blockSize
        screenY = (49 - z) * self.blockSize -- Invert Z so ground is at bottom
    else
        -- East/West views: Y-axis horizontal, Z-axis vertical
        screenX = y * self.blockSize
        screenY = (49 - z) * self.blockSize -- Invert Z so ground is at bottom
    end
    
    return screenX, screenY
end

function ElevationRenderer:drawElevationBlock(face)
    local x, y = face.screenX, face.screenY
    local blockType = face.type
    
    -- Get the hatch pattern definition for this block type
    local blockDef = self.hatchPatterns.blockTypes[blockType]
    if blockDef then
        -- Draw block with hatch pattern using correct API
        self.hatchPatterns:drawPattern(x, y, self.blockSize, self.blockSize, blockDef.pattern, blockDef.color)
        
        -- Draw border - match wireframe blueprint blue #64b5f6
        love.graphics.setColor(0.392, 0.71, 0.96, 1.0)
        love.graphics.setLineWidth(1)
        love.graphics.rectangle('line', x, y, self.blockSize, self.blockSize)
    end
end

function ElevationRenderer:drawPreviewBlock(x, y, z, blockType)
    if not blockType then return end
    
    local screenX, screenY = self:worldToScreen(x, y, z)
    
    -- Get the hatch pattern definition for this block type
    local blockDef = self.hatchPatterns.blockTypes[blockType]
    if blockDef then
        -- Draw preview block with low opacity
        love.graphics.setColor(blockDef.color[1], blockDef.color[2], blockDef.color[3], 0.5)
        love.graphics.rectangle('fill', screenX, screenY, self.blockSize, self.blockSize)
        
        -- Draw preview border (solid line with different color)
        love.graphics.setColor(0.8, 0.8, 0.0, 0.8) -- Yellow preview border
        love.graphics.setLineWidth(3)
        love.graphics.rectangle('line', screenX, screenY, self.blockSize, self.blockSize)
    end
end

function ElevationRenderer:screenToWorld(screenX, screenY)
    -- Account for left sidebar (280px width)
    local sidebarWidth = 280
    local adjustedX = screenX - sidebarWidth
    
    -- Convert screen coordinates to world coordinates
    local worldX = (adjustedX - self.viewport.width / 2) / self.camera.zoom + self.camera.x
    local worldY = (screenY - self.viewport.height / 2) / self.camera.zoom + self.camera.y
    
    -- Convert to grid coordinates
    local gridSize = self.blockSize
    local gridX = math.floor(worldX / gridSize + 0.5)
    local gridZ = math.floor(worldY / gridSize + 0.5)
    
    -- For elevation views, we need to handle the coordinate mapping properly
    if self.direction == 'north' or self.direction == 'south' then
        -- X and Z coordinates
        return gridX, 0, gridZ
    else
        -- Y and Z coordinates
        return 0, gridX, gridZ
    end
end

function ElevationRenderer:handleResize(width, height)
    self.viewport.width = width
    self.viewport.height = height
end

return ElevationRenderer
