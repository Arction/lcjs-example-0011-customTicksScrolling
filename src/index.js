/*
 * LightningChartJS example that showcases a simulated ECG signal.
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Import xydata
const xydata = require('@arction/xydata')

// Extract required parts from LightningChartJS.
const { lightningChart, AxisScrollStrategies, AxisTickStrategies, UIElementBuilders, Themes } = lcjs

// Import data-generators from 'xydata'-library.s
const { createProgressiveTraceGenerator } = xydata

// Create a XY Chart.
const chart = lightningChart()
    .ChartXY({
        // theme: Themes.darkGold
    })
    .setTitle('Custom X ticks with scrolling Axis')

// Create line series optimized for regular progressive X data.
const series = chart.addLineSeries({
    dataPattern: {
        // pattern: 'ProgressiveX' => Each consecutive data point has increased X coordinate.
        pattern: 'ProgressiveX',
        // regularProgressiveStep: true => The X step between each consecutive data point is regular (for example, always `1.0`).
        regularProgressiveStep: true,
    },
})

// * Manage X Axis ticks with custom logic *
// Disable default X ticks.
const xAxis = chart.getDefaultAxisX().setTickStrategy(AxisTickStrategies.Empty)

const addCustomTickX = (pos, isMinor) => {
    const tick = xAxis
        .addCustomTick(isMinor ? UIElementBuilders.AxisTickMinor : UIElementBuilders.AxisTickMajor)
        // Set tick text.
        .setTextFormatter(() => String(pos))
        // Set tick location.
        .setValue(pos)
    customTicks.push(tick)
    return tick
}

// Create custom ticks on X Axis on realtime scrolling application.
let customTicks = []
const createTicksInRangeX = (start, end) => {
    // Major ticks every 1000 units.
    const majorTickInterval = 1000
    for (let majorTickPos = start - (start % majorTickInterval); majorTickPos <= end; majorTickPos += majorTickInterval) {
        if (majorTickPos >= start) {
            addCustomTickX(majorTickPos, false)
        }
    }
    // Major ticks every 100 units, but not at same interval as major ticks.
    const minorTickInterval = 100
    for (let minorTickPos = start - (start % minorTickInterval); minorTickPos <= end; minorTickPos += minorTickInterval) {
        if (minorTickPos >= start && minorTickPos % majorTickInterval !== 0) {
            addCustomTickX(minorTickPos, true)
        }
    }
}
// X range until which custom ticks are valid.
let customTicksPos = 0
xAxis.onIntervalChange((_, start, end) => {
    // Ensure new ticks are created.
    if (end > customTicksPos) {
        createTicksInRangeX(customTicksPos, end)
        customTicksPos = end
    }

    // Destroy ticks that are out of scrolling range.
    customTicks = customTicks.filter((tick) => {
        if (tick.getValue() < start) {
            // Tick is out of view.
            tick.dispose()
            return false
        } else {
            return true
        }
    })
})

// Setup X Axis as progressive scrolling.
xAxis
    .setTitle('X Axis (custom ticks)')
    .setInterval({ start: 0, end: 1400, stopAxisAfter: false })
    .setScrollStrategy(AxisScrollStrategies.progressive)

chart.getDefaultAxisY().setTitle('Y Axis')

// Stream data in.
createProgressiveTraceGenerator()
    .setNumberOfPoints(10000)
    .generate()
    .setStreamRepeat(true)
    .setStreamInterval(1000 / 60)
    .setStreamBatchSize(5)
    .toStream()
    .forEach((point) => {
        series.add(point)
    })
