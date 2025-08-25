local BaseTool = {}
BaseTool.__index = BaseTool

function BaseTool:new(name, appState, blockData)
    local o = {}
    setmetatable(o, self)
    self.__index = self
    
    o.name = name
    o.appState = appState
    o.blockData = blockData
    
    return o
end

function BaseTool:onMousePressed(worldX, worldY, button)
    -- Override in subclasses
end

function BaseTool:onMouseReleased(worldX, worldY, button)
    -- Override in subclasses
end

function BaseTool:onMouseMoved(worldX, worldY)
    -- Override in subclasses
end

return BaseTool
