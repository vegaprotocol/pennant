import "banderole/dist/style.css";

import { Banderole } from "banderole";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Colors } from "../../helpers";
import { useThrottledResizeObserver } from "../../hooks";
import { string2hex } from "../../renderer/utils";
import { Study } from "../../types";
import chartStories from "../chart/chart.stories";
import { Pane as PaneView } from "../pane";
import { CloseButton } from "../pane-view/close-button";
import styles from "./candlestick-chart.module.css";
import { Chart, Pane } from "./chart";

export interface Options {
  studies: Study[];
}

export type CandlestickChartProps = {
  options?: Options;
  onOptionsChanged?: (options: Options) => void;
};

export interface CandlestickChartHandle {}

export const CandlestickChart = forwardRef(
  (
    { options = { studies: [] }, onOptionsChanged }: CandlestickChartProps,
    ref: React.Ref<CandlestickChartHandle>
  ) => {
    const chartRef = useRef<Chart>(null!);
    const paneRef = useRef<Record<number, HTMLElement>>({});

    const previousStudies = useRef<Study[]>([]);

    const studies = options.studies;

    useEffect(() => {
      chartRef.current = new Chart();
    }, []);

    useEffect(() => {
      const enter = studies.map(
        (study) => !previousStudies.current.includes(study)
      );

      const exit = previousStudies.current.map(
        (study) => !studies.includes(study)
      );

      console.log(enter, exit, paneRef.current);

      for (let i = exit.length - 1; i >= 0; i--) {
        if (exit[i]) {
          console.log("removing " + i);
          chartRef.current?.removePane(i);
        }
      }

      enter.forEach((flag, index) => {
        if (flag) {
          if (paneRef.current[index]) {
            chartRef.current?.addPane(
              new Pane(paneRef.current[index], { closable: true })
            );
          }
        }
      });

      previousStudies.current = studies;
    }, [studies]);

    const handleClosePane = (index: number) => {
      const newStudies = [...options.studies];
      newStudies.splice(index, 1);

      onOptionsChanged?.({
        ...options,
        studies: newStudies,
      });
    };

    return (
      <div className={styles.container}>
        <Banderole vertical>
          {studies.map((study, studyIndex) => (
            <PaneView
              key={studyIndex}
              ref={(el: HTMLElement | null) => {
                if (el) {
                  paneRef.current[studyIndex] = el;
                } else {
                  delete paneRef.current[studyIndex];
                }
              }}
              onClose={() => {
                handleClosePane(studyIndex);
              }}
            >
              <div style={{ color: "white", padding: "8px" }}>{study}</div>
            </PaneView>
          ))}
        </Banderole>
      </div>
    );
  }
);

CandlestickChart.displayName = "CandlestickChart";
