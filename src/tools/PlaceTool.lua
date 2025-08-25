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
    if button == 1 then -- Left mouse button
        print(string.format("PlaceTool: Received world coordinates (%.2f, %.2f)", worldX, worldY))
        
        local gridX, gridY = self:snapToGrid(worldX, worldY)
        local gridZ = self.appState.currentLevel
        
        print(string.format("PlaceTool: After grid snapping (%d, %d), level %d", gridX, gridY, gridZ))
        print(string.format("PlaceTool: Selected block type: %s", self.appState.selectedBlockType))
        
        -- Place block at current level (no coordinate limits for X and Y)
        local success, message = self.blockData:setBlock(gridX, gridY, gridZ, self.appState.selectedBlockType)
        if success then
            print(string.format("PlaceTool: SUCCESS - Block placed at (%d, %d, %d): %s", gridX, gridY, gridZ, self.appState.selectedBlockType))
        else
            print(string.format("PlaceTool: FAILED - %s", message))
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
