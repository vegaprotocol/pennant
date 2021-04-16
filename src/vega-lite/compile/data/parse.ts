import { DataFlowNode, OutputNode } from "./dataflow";
import { TechnicalIndicatorTransform, Transform } from "../../transform";

import { DataComponent } from ".";
import { Model } from "../model";
import { SourceNode } from "./source";
import { TechnicalIndicatorTransformNode } from "./technicalIndicator";

function isTechnicalIndicator(t: Transform): t is TechnicalIndicatorTransform {
  return "indicator" in t;
}

export function parseTransformArray(head: DataFlowNode, model: Model) {
  for (const t of model.transforms) {
    if (isTechnicalIndicator(t)) {
      head = new TechnicalIndicatorTransformNode(head, t);
    }
  }

  return head;
}

function parseRoot(model: Model) {
  if (model.data === null) {
    return new SourceNode({ values: [] });
  } else {
    return new SourceNode(model.data);
  }
}

export function parseData(model: Model): DataComponent {
  let head: DataFlowNode = parseRoot(model);

  const { outputNodes } = model.component.data;

  const data = model.data;

  if (model.transforms.length > 0) {
    head = parseTransformArray(head, model);
  }

  return {
    ...model.component.data,
    outputNodes: { data: head },
  };
}
