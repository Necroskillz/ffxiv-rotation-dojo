import { AppThunk } from '../../app/store';

class StateInitializer {
  private actions: AppThunk<void>[] = [];

  registerAction(action: AppThunk<void>) {
    this.actions.push(action);
  }

  initialize: AppThunk<void> = (dispatch) => {
    for (const action of this.actions) {
      dispatch(action);
    }
  };

  clear() {
    this.actions = [];
  }
}

export const stateInitializer = new StateInitializer();
