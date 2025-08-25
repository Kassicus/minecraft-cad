local BaseTool = require('src.tools.BaseTool')

local PlaceTool = setmetatable({}, BaseTool)
PlaceTool.__index = PlaceTool

function PlaceTool:new(blockData, appState)
    print("*** PLACE TOOL NEW CALLED ***")
    local self = setmetatable(BaseTool:new('place', blockData, appState), PlaceTool)
    print("*** PLACE TOOL NEW COMPLETED ***")
    return self
end

function PlaceTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left click only
        -- Snap to grid
        local gridX, gridY = self:snapToGrid(worldX, worldY)
        
        -- Get current level from app state
        local level = self.appState.currentLevel
        
        -- Get selected block type
        local blockType = self.appState.selectedBlockType
        if not blockType then
            return
        end
        
        -- Place the block
        local success = self.blockData:setBlock(gridX, gridY, level, blockType)
        
        if success then
            -- Block placed successfully
            return true
        else
            -- Failed to place block
            return false
        end
    end
end

function PlaceTool:snapToGrid(worldX, worldY)
    -- Snap to the center of the cell containing the mouse cursor
    -- This means if you're anywhere within a cell, it snaps to that cell
    local gridX = math.floor(worldX)
    local gridY = math.floor(worldY)
    
    return gridX, gridY
end

return PlaceTool
