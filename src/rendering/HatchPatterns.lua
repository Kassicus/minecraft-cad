local HatchPatterns = {}
HatchPatterns.__index = HatchPatterns

function HatchPatterns:new()
    local o = {}
    setmetatable(o, self)
    self.__index = self
    
    -- Define hatch patterns for different block types
    o.blockTypes = {
        blockA = {pattern = 'solid', color = {0.2, 0.6, 1.0}},
        blockB = {pattern = 'diagonal', color = {0.8, 0.3, 0.3}},
        blockC = {pattern = 'crosshatch', color = {0.3, 0.8, 0.3}},
        blockD = {pattern = 'dots', color = {0.8, 0.8, 0.2}},
        blockE = {pattern = 'brick', color = {0.8, 0.5, 0.2}}
    }
    
    return o
end

function HatchPatterns:drawPattern(x, y, width, height, patternType, color)
    love.graphics.setColor(unpack(color))
    
    if patternType == 'solid' then
        love.graphics.rectangle('fill', x, y, width, height)
    elseif patternType == 'diagonal' then
        -- Draw diagonal lines
        love.graphics.setLineWidth(1)
        for i = 0, width + height, 4 do
            love.graphics.line(x + i, y, x + i - height, y + height)
        end
    elseif patternType == 'crosshatch' then
        -- Draw crosshatch pattern
        love.graphics.setLineWidth(1)
        for i = 0, width, 4 do
            love.graphics.line(x + i, y, x + i, y + height)
        end
        for i = 0, height, 4 do
            love.graphics.line(x, y + i, x + width, y + i)
        end
    elseif patternType == 'dots' then
        -- Draw dot pattern
        for i = 2, width - 2, 6 do
            for j = 2, height - 2, 6 do
                love.graphics.circle('fill', x + i, y + j, 1)
            end
        end
    elseif patternType == 'brick' then
        -- Draw brick pattern
        love.graphics.setLineWidth(1)
        for i = 0, height, 8 do
            love.graphics.line(x, y + i, x + width, y + i)
        end
        for i = 0, width, 16 do
            love.graphics.line(x + i, y, x + i, y + height)
        end
    end
end

return HatchPatterns
