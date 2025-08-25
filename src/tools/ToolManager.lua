local ToolManager = {}
ToolManager.__index = ToolManager

function ToolManager:new(blockData, appState)
    local self = setmetatable({}, ToolManager)
    self.blockData = blockData
    self.appState = appState
    
    local PlaceTool = require('src.tools.PlaceTool')
    local EraseTool = require('src.tools.EraseTool')
    local RectangleTool = require('src.tools.RectangleTool')
    local CircleTool = require('src.tools.CircleTool')
    local LineTool = require('src.tools.LineTool')
    local FillTool = require('src.tools.FillTool')
    
    self.tools = {
        place = PlaceTool:new(blockData, appState),
        erase = EraseTool:new(blockData, appState),
        rectangle = RectangleTool:new(blockData, appState),
        circle = CircleTool:new(blockData, appState),
        line = LineTool:new(blockData, appState),
        fill = FillTool:new(blockData, appState)
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
