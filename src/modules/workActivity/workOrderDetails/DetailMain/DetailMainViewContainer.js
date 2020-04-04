import {
  compose, withState, lifecycle,
} from 'recompose';
import { connect } from 'react-redux';

import { setChanges, setActivityId } from '../../../workOrder/WorkOrderState';
import { apiGetJson } from '../../../../core/api';
import { setPartModalVisible } from '../../../AppState';

import DetailMainView from './DetailMainView';

export default compose(
  connect(
    state => ({
      changes: state.workOrder.changesInOffline,
      activityId: state.workOrder.activityId,
      connectionStatus: state.app.isConnected,
      orderList: state.workOrder.orderList,
      token: state.profile.security_token.token,
    }),
    dispatch => ({
      setChanges: arr => dispatch(setChanges(arr)),
      setModalVisible: payload => dispatch(setPartModalVisible(payload)),
      setActivityId: id => dispatch(setActivityId(id)),
    }),
  ),
  withState('changesInOffline', 'setChangesInOffline', 0),
  withState('activityData', 'setActivityData', {}),
  withState('isLoading', 'setIsloading', true),
  withState('details', 'setDetails', []),
  lifecycle({
    async componentDidMount() {
      this.props.setChangesInOffline(this.props.changes.length);
      if (this.props.connectionStatus) {
        await apiGetJson(`test-app-1/activities/${this.props.activityId}?with=[%22items%22]`, this.props.token)
          .then((response) => {
            console.log(response);
            this.props.setActivityData(response.data);
            this.props.setIsloading(false);
          });
        await apiGetJson(
          `test-app-1/activities/${this.props.activityId}/details`,
          this.props.token,
          'multipart/form-data',
        )
          .then((response) => {
            this.props.setDetails(response.data[0]);
          });
      } else {
        this.props.setActivityData(
          this.props.orderList.filter(order => order.id === this.props.activityId)[0],
        );
        this.props.setIsloading(false);
      }
    },
  }),
)(DetailMainView);
