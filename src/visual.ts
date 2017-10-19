/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    "use strict";
    export class Visual implements IVisual {
        private target: HTMLElement;
        private updateCount: number;
        private settings: VisualSettings;
        private textNode: Text;

        constructor(options: VisualConstructorOptions) {
            this.target = options.element;
        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
            const values = this.getValuesToDisplay(options);
            let displayValue;
            let strategy;
            if (values.length == 1) {
                //If only one value is selected
                displayValue = values[0];
            }
            else {
                //If several values are selected
                let sum = values.reduce((tot, v) => { return tot + v; });
                switch (this.settings.dataPoint.valueReduceStrategy) {
                    case "Average":
                        displayValue = sum / values.length;
                        strategy = "Average";
                        break;
                    case "Sum":
                        displayValue = sum;
                        strategy = "Sum";
                        break;
                    case "First":
                        displayValue = values[0];
                        strategy = "First";
                        break;
                    case "Last":
                        displayValue = values[values.length - 1];
                        strategy = "Last";
                        break;
                }
            }
            if (displayValue.toString().split(".")[1])
                displayValue = displayValue.toFixed(2)
            this.render(displayValue, strategy);
        }

        private render(value: number, strategy: string) {
            this.target.innerHTML = "";
            let container = document.createElement("div");
            let valueElement = document.createElement("div");
            valueElement.setAttribute("class", "valueElement");
            valueElement.innerHTML = value.toString();
            container.appendChild(valueElement);
            this.target.appendChild(container);

            // Add explanation if value reduction is performed
            if (strategy) {
                let explanation = document.createElement("div");
                explanation.innerHTML = strategy;
                explanation.setAttribute("class", "explanationElement")
                container.appendChild(explanation);
            }
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        /**
         * Returns an array of values that is the values to be displayed.
         * If any values are highlighted, only highlighted values are returned
         * @param options The visual update options
         */
        private getValuesToDisplay(options: VisualUpdateOptions): Array<number> {
            const values = options.dataViews[0].categorical.values; // Just get the first array of values
            let highlights = values[0].highlights; // If highlights is undefined, nothing is selected
            if (highlights) {
                // Something is highlighted.
                return highlights.filter((v) => { return v != null }) as Array<number>;
            }
            // If nothing is highlighted, return all values
            return values[0].values as Array<number>;
        }


        /** 
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the 
         * objects and properties you want to expose to the users in the property pane.
         * 
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}