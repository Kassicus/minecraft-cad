local ToolManager = {}
ToolManager.__index = ToolManager

function ToolManager:new(blockData, appState)
    local self = setmetatable({}, ToolManager)
    self.blockData = blockData
    self.appState = appState
    
    local PlaceTool = require('src.tools.PlaceTool')
    local EraseTool = require('src.tools.EraseTool')
    
    self.tools = {
        place = PlaceTool:new(blockData, appState),
        erase = EraseTool:new(blockData, appState)
    }
    
    self.currentTool = 'place'
    
    return self
end

function ToolManager:getCurrentTool()
    return self.tools[self.currentTool]
end

function ToolManager:setCurrentTool(toolName)
    if self.tools[toolName] then
        self.currentTool = toolName
    end
end

return ToolManager
