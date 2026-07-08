#include<iostream>
#include<vector>
#include<math.h>
#include<queue>
#include<climits>
using namespace std;

#include "json.hpp"
using json = nlohmann::json;

struct Transaction{
    string from;
    string to;
    double amount;
};

int main(){
    json input;
    cin >> input;

    vector<string> userIds;
    vector<double> amounts;

    for(auto ele:input["balances"]){
        double amt = ele["amount"].get<double>();

        if(abs(amt) > 1e-9){
            userIds.push_back(ele["userId"].get<string>());
            amounts.push_back(amt);
        }
    }

    double totalSystemSum = 0.0;
    for (double amt : amounts) {
        totalSystemSum += amt;
    }
    if (abs(totalSystemSum) > 1e-9) {
        cerr << "Error: Total balances do not sum to zero!" << endl;
        return 1; 
    }

    int n = amounts.size();
    int states = 1 << n;

    vector<double> sum(states, 0.0);

    for(int mask = 1;mask < states;mask++){
        int lsb = mask & (-mask);
        int bit = __builtin_ctz(lsb);
        sum[mask] = sum[mask ^ lsb] + amounts[bit];
    }

    vector<int> dp(states, INT_MAX);
    vector<int> parentSplit(states, -1); 
    dp[0] = 0;
    
    for(int mask = 1;mask < states;mask++){
        if(abs(sum[mask]) < 1e-9){
            dp[mask] = __builtin_popcount(mask) - 1;
        }

        for(int sub = (mask - 1) & mask;sub > 0;sub = (sub - 1) & mask ){
            if(dp[sub] != INT_MAX && dp[sub ^ mask] != INT_MAX){
                if(dp[sub] + dp[mask^sub] < dp[mask]) {
                    dp[mask] = dp[sub] + dp[mask^sub];
                    parentSplit[mask] = sub;
                }
            }
        }
    }

    vector<Transaction> optimalTransactions;
    vector<int> pendingMasks;
    
    if (states > 1 && dp[states - 1] != INT_MAX) {
        pendingMasks.push_back(states - 1);
    }

    vector<int> independentGroups;
    while (!pendingMasks.empty()) {
        int curr = pendingMasks.back();
        pendingMasks.pop_back();

        if (parentSplit[curr] != -1) {
            pendingMasks.push_back(parentSplit[curr]);
            pendingMasks.push_back(curr ^ parentSplit[curr]);
        } else {
            if (curr > 0) {
                independentGroups.push_back(curr);
            }
        }
    }

    for (int groupMask : independentGroups) {
        vector<int> groupCreditors;
        vector<int> groupDebtors;
        
        vector<double> groupAmounts(n, 0.0);
        for (int i = 0; i < n; i++) {
            if ((groupMask >> i) & 1) {
                groupAmounts[i] = amounts[i];
                if (amounts[i] > 1e-9) groupCreditors.push_back(i);
                else if (amounts[i] < -1e-9) groupDebtors.push_back(i);
            }
        }

        size_t cPtr = 0, dPtr = 0;
        while (cPtr < groupCreditors.size() && dPtr < groupDebtors.size()) {
            int cIdx = groupCreditors[cPtr];
            int dIdx = groupDebtors[dPtr];

            double creditLeft = groupAmounts[cIdx];
            double debtLeft = -groupAmounts[dIdx];

            double settle = min(creditLeft, debtLeft);
            optimalTransactions.push_back({userIds[dIdx], userIds[cIdx], settle});

            groupAmounts[cIdx] -= settle;
            groupAmounts[dIdx] += settle;

            if (groupAmounts[cIdx] <= 1e-9) cPtr++;
            if (groupAmounts[dIdx] >= -1e-9) dPtr++;
        }
    }

    json output;

    output["transactions"] = json::array();
    output["optimalCount"] = dp[states - 1] == INT_MAX ? -1 : dp[states - 1];
    output["actualOptimalTxCount"] = optimalTransactions.size();

    for (auto& ele : optimalTransactions) {
        output["transactions"].push_back({
            {"from", ele.from},
            {"to", ele.to},
            {"amount", round(ele.amount * 100) / 100}
        });
    }

    cout << output.dump() << endl;
    return 0;
}
