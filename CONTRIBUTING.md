# Contributing

Thanks for taking the time to contribute! :tada: :confetti_ball: :+1:

## Adding a new technical indicator

1. Add the new indicator to the `Indicator` type
1. If the indicator is a study then add it to the `Study` type and provide a human readable string in the `studyLabels` record. If the indicator is an overlay then add it to the `Overlay` type and provide a human readable string in the `overlayLabels` record.
1. Add a new case to the switch statement in `parse.ts`. This should add new properties to the each data element as appropriate.
1. If the indicator is a study then add a new case to the switch statement in `constructStudyLayerSpec`. If the indicator is an overlay then add a new case to the switch statement in `constructOverlayLayerSpec`. This defines how the data should be interpreted. In particular the encoding determines which keys are used to look up values on data elements.
1. If the indicator is a study then add a new case to the switch statement in `constructStudyTransform`. If the indicator is an overlay then add a new case to the switch statement in `constructOverlayTransform`. This defines the mapping between the study or overlay asked for in the public interface to the underlying indicator and the data on which it operates, e.g. `close`.
1. Add a new entry to the `studyInfoFields` record. This defines the summary information a user sees when interacting with the chart.
