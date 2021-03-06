import { ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as d3 from 'd3-shape';

import { WidgetInstanceService } from '../../../grid/grid.service';
import { RuntimeService } from '../../../services/runtime.service';
import { WidgetPropertyService } from '../../_common/widget-property.service';
import { EndPointService } from '../../../configuration/tab-endpoint/endpoint.service';
import { WidgetBase } from '../../_common/widget-base';

import { LineChartWidgetService } from './line-chart-widget.service';

export type D3 = typeof d3;

@Component({
    selector: 'adf-dynamic-component',
    moduleId: module.id,
    templateUrl: './line-chart-widget.component.html',
    styleUrls: ['../../_common/styles-widget.css']
})
export class LineChartWidgetComponent extends WidgetBase {
    topic: any;

    // chart options
    showXAxis  = true;
    showYAxis  = true;
    gradient  = true;
    showLegend  = true;
    showXAxisLabel  = true;
    showYAxisLabel  = true;
    yAxisLabel  = 'IOPS';
    xAxisLabel  = 'Time';
    autoScale = true;
    view: any[];
    colorScheme: any = {
        domain: ['#2185D0', '#0AFF16']
    };

    d3:D3 = d3;

    multi: any[] = [];

    collectors: Array<string> = [];

    eventTimerSubscription: any;

    constructor(protected _chartService: LineChartWidgetService,
                protected _runtimeService: RuntimeService,
                protected _widgetInstanceService: WidgetInstanceService,
                protected _propertyService: WidgetPropertyService,
                protected _endPointService: EndPointService,
                protected _changeDetectionRef: ChangeDetectorRef) {
        super(_runtimeService,
            _widgetInstanceService,
            _propertyService,
            _endPointService,
            _changeDetectionRef);
    }

    public preRun(): void {

        this.setHelpTopic();
        /**
         * todo - get collectors from property page data
         * @type {[string,string]}
         */
        this.collectors = ['read', 'write'];

        for (let y = 0; y < this.collectors.length; y++) {

            this.multi[y] = {
                'name': this.collectors[y],
                'series': LineChartWidgetService.seedData()
            };
        }
    }

    public run() {
        this.errorExists = false;
        this.actionInitiated = true;
        this.actionInitiated = false;
        this.inRun = true;

        this.updateData();
    }

    public stop() {
        this.errorExists = false;
        this.actionInitiated = true;
        this.actionInitiated = false;
        this.inRun = false;

        this._chartService.stop(this.eventTimerSubscription);
    }

    public updateData() {
        this.eventTimerSubscription = this._chartService.get(this.collectors).subscribe(data => {
                for (let x = 0; x < this.collectors.length; x++) {
                    this.multi[x].series.shift();
                    this.multi[x].series.push(data[x]);
                }
                this.multi = [...this.multi];
            },
            error => this.handleError(error));
    }

    public updateProperties(updatedProperties: any) {
        /**
         * todo
         *  A similar operation exists on the procmman-config-service
         *  whenever the property page form is saved, the in memory board model
         *  is updated as well as the widget instance properties
         *  which is what the code below does. This can be eliminated with code added to the
         *  config service or the property page service.
         *
         * **/

        const updatedPropsObject = JSON.parse(updatedProperties);

        this.propertyPages.forEach(function (propertyPage) {
            for (let x = 0; x < propertyPage.properties.length; x++) {
                for (const prop in updatedPropsObject) {
                    if (updatedPropsObject.hasOwnProperty(prop)) {
                        if (prop === propertyPage.properties[x].key) {
                            propertyPage.properties[x].value = updatedPropsObject[prop];
                        }

                    }
                }
            }
        });

        this.title = updatedPropsObject.title;
        this.showXAxis = updatedPropsObject.chart_properties;
        this.showYAxis = updatedPropsObject.chart_properties;
        this.gradient = updatedPropsObject.chart_properties;
        this.showLegend = updatedPropsObject.chart_properties;
        this.showXAxisLabel = updatedPropsObject.chart_properties;
        this.showYAxisLabel = updatedPropsObject.chart_properties;

        this.setEndPoint(updatedPropsObject.endpoint);

        this.showOperationControls = true;
        /**
         * todo - adjust collectors from property page data
         * @type {[string,string]}
         */
    }

    private setHelpTopic() {
        this._chartService.getHelpTopic().subscribe(data => {
            this.topic = data;
        });
    }
}
