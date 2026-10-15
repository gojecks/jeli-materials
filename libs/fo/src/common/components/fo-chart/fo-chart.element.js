import { LazyLoader } from '@jeli/core';

export const CHART_URL = new ProviderToken('chartURL', false, {
    value: ['https://cdn.jsdelivr.net/npm/chart.js']
});

Element({
    selector: 'fo-chart',
    templateUrl: './fo-chart.element.html',
    styleUrl: './fo-chart.element.scss',
    props: ['config'],
    DI: [CHART_URL],
    viewChild: ['canvasElement:ElementRef']
})
export class FoChartElement {
    id = `chart_${Date.now()}`;
    canvasElement = null;
    chartInstance = null;
    _config = null;
    constructor(chartUrl) { 
        this.chartUrl = chartUrl;
    }

    set config(value) {
        this._config = value;
        this.renderChart();
    }

    get config(){
        return this._config;
    }

    didInit() {
        LazyLoader.staticLoader(this.chartUrl, () =>  this.renderChart());
    }

    renderChart() {
        if (window.Chart && this.canvasElement && this._config) {
            this.chartInstance = new window.Chart(this.canvasElement.nativeElement, this._config);
        }
    }

    viewDidDestroy() {
        this.chartInstance = null;
    }

}
