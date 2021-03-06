import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, View, FlatList, StatusBar, Image, ActivityIndicator } from 'react-native';
import { apiGetJson, apiGetActivities } from '../../core/api';

import { Text } from '../../components/StyledText';
import { Header, OrderListTile } from '../../components';
import { colors } from '../../styles';

export default class WorkOrderScreen extends Component {
  constructor(props) {
    super(props);
    this.page = 1;
    this.state = {
      isDataLoading: false
    };
  }

  render() {
    const renderTile = (item, index) => <OrderListTile index={index} item={item} setActivityId={this.props.setActivityId} navigation={this.props.navigation} />;

    const loadMoreWorkOrders = async () => {
      if (this.props.orderList.length < this.props.workOrdersFullCount && !this.state.isDataLoading) {
        this.setState({
          isDataLoading: true
        });

        const statuses = '&search={"fields":[{"operator": "is_in","value": ["assigned","in_progress"],"field": "status"}]}&sort_by=id&sort_order=asc';
        const data = await apiGetActivities('spectrum/activities?with=["items","accounts"]&page=' + (this.page + 1) + '&count=10' + statuses, this.props.token);

        const result = this.props.orderList;

        if (data.data.data.length > 0) {
          await data.data.data.forEach(activity => {
            result.push(activity);
          });
          this.page += 1;
          this.props.setOrderList(result);
          this.setState({
            isDataLoading: false
          });
        }
      }
    };

    const renderFooter = () => {
      if (!this.state.isDataLoading) return null;

      return (
        <View
          style={{
            paddingVertical: 20
          }}
        >
          <ActivityIndicator animating size="small" />
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.lightGray} barStyle="dark-content" />
        <Header
          connectionStatus={this.props.connectionStatus}
          changesNum={this.props.changes.length}
          navigation={this.props.navigation}
          sortAndFilter
          indicator
          title=""
        />
        {this.props.orderList === [] && this.props.connectionStatus ? (
          <View style={styles.containerIndicator}>
            <Text>There is no connection</Text>
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%' }}>
            {this.props.isLoaded === true ? (
              <FlatList
                ListHeaderComponent={null}
                scrollEventThrottle={16}
                refreshing={false}
                onRefresh={async () => {
                  this.page = 1;
                  this.props.refreshList();
                }}
                data={this.props.orderList}
                keyExtractor={(item, index) => {
                  return index.toString();
                }}
                renderItem={({ item, index }) => renderTile(item, index)}
                onEndReached={loadMoreWorkOrders}
                onEndReachedThreshold={0.1}
                ListFooterComponent={renderFooter}
              />
            ) : (
              <Image style={{ height: '100%', width: '100%' }} source={require('../../../assets/images/loading.gif')} />
            )}
          </View>
        )}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.lightGray
  },
  containerIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray
  },
  bgImage: {
    flex: 1,
    position: 'absolute'
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    marginTop: 30
  },
  tileContainer: {
    width: '100%',
    paddingTop: 8,
    backgroundColor: 'white',
    marginBottom: 8,
    flexDirection: 'row',
    paddingRight: 16
  },
  tileLogoContainer: {
    width: '15%',
    alignItems: 'center'
  },
  tileLogo: {
    width: 50,
    height: 50,
    aspectRatio: 1
  },
  tileInfoContainer: {
    width: '85%',
    paddingLeft: 8
  },
  infoCompany: {
    fontSize: 14,
    fontWeight: '500'
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '500',
    paddingTop: 8
  },
  infoBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 32
  },
  infoBottomText: {
    color: '#636363',
    fontSize: 12
  }
});
