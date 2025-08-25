local BaseTool = require('src.tools.BaseTool')

local FillTool = setmetatable({}, BaseTool)
FillTool.__index = FillTool

function FillTool:new(blockData, appState)
    local self = setmetatable(BaseTool:new('fill', appState, blockData), FillTool)
    
    -- Ensure we have access to appState and blockData
    self.appState = appState
    self.blockData = blockData
    
    return self
end

function FillTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left click only
        -- Get grid coordinates
        local gridX, gridY = self:snapToGrid(worldX, worldY)
        local level = self.appState.currentLevel
        
        -- Get the block type at the clicked position
        local targetBlockType = self.blockData:getBlock(gridX, gridY, level)
        
        if targetBlockType then
            -- Get the block type to fill with
            local fillBlockType = self.appState.selectedBlockType
            
            if fillBlockType and fillBlockType ~= targetBlockType then
                -- Perform flood fill
                self:floodFill(gridX, gridY, level, targetBlockType, fillBlockType)
                return true
            end
        end
    end
    
    return false
end

function FillTool:floodFill(startX, startY, level, targetBlockType, fillBlockType)
    -- Use iterative flood fill to avoid stack overflow
    local stack = {{startX, startY}}
    local visited = {}
    
    while #stack > 0 do
        local coords = table.remove(stack)
        local x, y = coords[1], coords[2]
        local key = x .. "," .. y
        
        -- Skip if already visited or out of bounds
        if visited[key] or x < -20 or x > 20 or y < -20 or y > 20 then
            goto continue
        end
        
        -- Check if this position has the target block type
        local currentBlock = self.blockData:getBlock(x, y, level)
        if currentBlock ~= targetBlockType then
            goto continue
        end
        
        -- Mark as visited and fill
        visited[key] = true
        self.blockData:setBlock(x, y, level, fillBlockType)
        
        -- Add neighbors to stack
        table.insert(stack, {x + 1, y})
        table.insert(stack, {x - 1, y})
        table.insert(stack, {x, y + 1})
        table.insert(stack, {x, y - 1})
        
        ::continue::
    end
end

function FillTool:snapToGrid(worldX, worldY)
    -- Snap to the center of the cell containing the mouse cursor
    local gridX = math.floor(worldX)
    local gridY = math.floor(worldY)
    
    return gridX, gridY
end

function FillTool:onMouseReleased(worldX, worldY, button)
    -- Fill tool doesn't need mouse release handling
    return false
end

function FillTool:onMouseMoved(worldX, worldY)
    -- Fill tool doesn't need mouse move handling
    return false
end

function FillTool:render()
    -- Fill tool doesn't need preview rendering
end

return FillTool
