local BaseTool = require('src.tools.BaseTool')

local EraseTool = setmetatable({}, BaseTool)
EraseTool.__index = EraseTool

function EraseTool:new(blockData, appState)
    print("*** ERASE TOOL NEW CALLED ***")
    local self = setmetatable(BaseTool:new('erase', blockData, appState), EraseTool)
    print("*** ERASE TOOL NEW COMPLETED ***")
    return self
end

function EraseTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left mouse button
        local gridX, gridY = self:snapToGrid(worldX, worldY)
        local gridZ = self.appState.currentLevel
        
        -- Remove block at current level (no coordinate limits for X and Y)
        local success, message = self.blockData:setBlock(gridX, gridY, gridZ, nil)
        if success then
            print(string.format("Block removed at (%d, %d, %d)", gridX, gridY, gridZ))
        else
            print("Failed to remove block:", message)
        end
    end
end

function EraseTool:snapToGrid(worldX, worldY)
    local gridSize = 20
    local gridX = math.floor(worldX / gridSize + 0.5)
    local gridY = math.floor(worldY / gridSize + 0.5)
    return gridX, gridY
end

return EraseTool
